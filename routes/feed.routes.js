"use strict";
const express = require("express");
const router = express.Router();
const { Op } = require("sequelize");
const jwt = require("jsonwebtoken");
const { sequelize, User, Post, PostComment, PostReaction } = require("../models");
const { requireAuth } = require("../middlewares/JWTAuth");

/** Helper: optionally read user id from Bearer token on public GETs */
function getOptionalUserId(req) {
  try {
    const h = String(req.headers.authorization || "");
    if (!h.startsWith("Bearer ")) return null;
    const token = h.slice(7);
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    return payload?.id || null;
  } catch {
    return null;
  }
}

// Public feed (auth optional to include myReaction)
router.get("/", async (req, res) => {
  try {
    const limit = Math.min(Number(req.query.limit) || 20, 50);
    const tab = String(req.query.tab || "all");
    const q = String(req.query.q || "").trim().toLowerCase();
    const before = req.query.before ? new Date(req.query.before) : null;

    const where = {};
    if (tab !== "all")
      where.type = tab === "posts" ? "post" : tab === "news" ? "news" : "trade";
    if (before) where.created_at = { [Op.lt]: before };
    if (q)
      where[Op.or] = [
        { text: { [Op.like]: `%${q}%` } },
        { coin: { [Op.like]: `%${q}%` } },
      ];

    const rows = await Post.findAll({
      where,
      order: [["created_at", "DESC"]],
      limit,
      include: [{ model: User, as: "author", attributes: ["id", "name", "email"] }],
    });

    // If user is auth'd, include myReaction for each post
    const uid = getOptionalUserId(req);
    let myMap = {};
    if (uid && rows.length) {
      const reacts = await PostReaction.findAll({
        where: { user_id: uid, post_id: { [Op.in]: rows.map((r) => r.id) } },
      });
      for (const r of reacts) myMap[r.post_id] = r.kind;
    }

    res.json({
      items: rows.map((r) => ({
        id: r.id,
        type: r.type,
        user_id: r.user_id,
        user: r.author?.name || "Anon",
        text: r.text,
        coin: r.coin,
        url: r.url,
        title: r.title,
        sentiment: r.sentiment,
        side: r.side,
        amount: r.amount,
        reactions: {
          like: r.like_count,
          rocket: r.rocket_count,
          fire: r.fire_count,
          think: r.think_count,
        },
        comment_count: r.comment_count,
        ts: r.created_at.getTime(),
        myReaction: myMap[r.id] || null,
        canDelete: false,
      })),
      nextCursor: rows.length ? rows[rows.length - 1].created_at.toISOString() : null,
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "Failed to fetch feed" });
  }
});

// Comments (public) — returns threaded (one level) via parent_id
router.get("/:id/comments", async (req, res) => {
  try {
    const postId = Number(req.params.id);
    const rows = await PostComment.findAll({
      where: { post_id: postId },
      order: [["created_at", "ASC"]],
      include: [{ model: User, as: "author", attributes: ["id", "name", "email"] }],
    });

    // Build one-level thread
    const byId = {};
    const roots = [];
    for (const c of rows) {
      const node = {
        id: c.id,
        user_id: c.user_id,
        user: c.author?.name || "Anon",
        text: c.text,
        ts: c.created_at.getTime(),
        parent_id: c.parent_id || null,
        replies: [],
      };
      byId[node.id] = node;
    }
    for (const node of Object.values(byId)) {
      if (node.parent_id && byId[node.parent_id]) byId[node.parent_id].replies.push(node);
      else roots.push(node);
    }

    res.json(roots);
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "Failed to fetch comments" });
  }
});

// Create post
router.post("/", requireAuth, async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const b = req.body || {};
    const type = ["post", "news", "trade"].includes(b.type) ? b.type : "post";
    const row = await Post.create(
      {
        user_id: req.user.id,
        type,
        text: String(b.text || "").slice(0, 4000),
        coin: (b.coin || "").toUpperCase().slice(0, 16) || null,
        url: b.url ? String(b.url).slice(0, 512) : null,
        title: b.title ? String(b.title).slice(0, 256) : null,
        sentiment: ["bullish", "bearish", "neutral"].includes(b.sentiment) ? b.sentiment : null,
        side: ["UP", "DOWN"].includes(b.side) ? b.side : null,
        amount: b.amount ? Number(b.amount) : null,
      },
      { transaction: t }
    );

    await t.commit();
    res.json({ id: row.id });
  } catch (e) {
    await t.rollback();
    console.error(e);
    res.status(400).json({ message: "Failed to create post" });
  }
});

// Add comment or reply
router.post("/:id/comments", requireAuth, async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const postId = Number(req.params.id);
    const text = String(req.body?.text || "").trim();
    const parentId = req.body?.parentId ? Number(req.body.parentId) : null;
    if (!text) return res.status(400).json({ message: "Text required" });

    if (parentId) {
      const parent = await PostComment.findByPk(parentId, { transaction: t });
      if (!parent || parent.post_id !== postId) {
        await t.rollback();
        return res.status(400).json({ message: "Invalid parent" });
      }
    }

    const c = await PostComment.create(
      { post_id: postId, user_id: req.user.id, text: text.slice(0, 2000), parent_id: parentId },
      { transaction: t }
    );

    await Post.increment({ comment_count: 1 }, { where: { id: postId }, transaction: t });
    await t.commit();
    res.json({ id: c.id });
  } catch (e) {
    await t.rollback();
    console.error(e);
    res.status(400).json({ message: "Failed to add comment" });
  }
});

// Toggle reaction (single reaction per user per post)
router.post("/:id/react", requireAuth, async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const postId = Number(req.params.id);
    const newKind = ["like", "rocket", "fire", "think"].includes(req.body?.kind) ? req.body.kind : null;
    if (!newKind) return res.status(400).json({ message: "Invalid reaction" });

    // Find any existing reaction for this user on this post (any kind)
    const existing = await PostReaction.findOne({
      where: { post_id: postId, user_id: req.user.id },
      transaction: t,
      lock: t.LOCK.UPDATE,
    });

    let myReaction = null;

    if (existing && existing.kind === newKind) {
      // same kind → remove (toggle off)
      await existing.destroy({ transaction: t });
      const field = `${newKind}_count`;
      await Post.increment({ [field]: -1 }, { where: { id: postId }, transaction: t });
      myReaction = null;
    } else {
      // different or none → switch to newKind
      if (existing) {
        const oldField = `${existing.kind}_count`;
        await existing.destroy({ transaction: t });
        await Post.increment({ [oldField]: -1 }, { where: { id: postId }, transaction: t });
      }
      await PostReaction.create({ post_id: postId, user_id: req.user.id, kind: newKind }, { transaction: t });
      const newField = `${newKind}_count`;
      await Post.increment({ [newField]: 1 }, { where: { id: postId }, transaction: t });
      myReaction = newKind;
    }

    const row = await Post.findByPk(postId, { transaction: t });
    await t.commit();

    res.json({
      ok: true,
      myReaction,
      counts: {
        like: row.like_count,
        rocket: row.rocket_count,
        fire: row.fire_count,
        think: row.think_count,
      },
    });
  } catch (e) {
    await t.rollback();
    console.error(e);
    res.status(400).json({ message: "Failed to react" });
  }
});

// Delete comment (owner, post owner, or admin)
router.delete("/:id/comments/:cid", requireAuth, async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const postId = Number(req.params.id);
    const cid = Number(req.params.cid);
    const comment = await PostComment.findByPk(cid, { transaction: t });
    if (!comment || comment.post_id !== postId) {
      await t.rollback();
      return res.status(404).json({ message: "Not found" });
    }

    const post = await Post.findByPk(postId, { transaction: t });
    if (comment.user_id !== req.user.id && post.user_id !== req.user.id && req.user.role !== "admin") {
      await t.rollback();
      return res.status(403).json({ message: "Forbidden" });
    }

    await comment.destroy({ transaction: t });
    await Post.increment({ comment_count: -1 }, { where: { id: postId }, transaction: t });
    await t.commit();
    res.json({ ok: true });
  } catch (e) {
    await t.rollback();
    console.error(e);
    res.status(400).json({ message: "Failed to delete comment" });
  }
});

// Delete post (owner or admin)
router.delete("/:id", requireAuth, async (req, res) => {
  try {
    const id = Number(req.params.id);
    const post = await Post.findByPk(id);
    if (!post) return res.status(404).json({ message: "Not found" });
    if (post.user_id !== req.user.id && req.user.role !== "admin") {
      return res.status(403).json({ message: "Forbidden" });
    }
    await post.destroy();
    res.json({ ok: true });
  } catch (e) {
    console.error(e);
    res.status(400).json({ message: "Failed to delete post" });
  }
});

module.exports = router;
