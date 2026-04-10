/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  Bell,
  Megaphone,
  Send,
  Trash2,
  Info,
  AlertTriangle,
  CheckCircle2,
  MessageSquare,
  Heart,
  ArrowLeft,
  ThumbsUp,
  Loader,
  Trash,
  Loader2,
} from "lucide-react";
import { communityApi, getRelativeTime } from "../services/apis";
import { useUser } from "../UserContext";
import { Like, Post, Comment } from "../services/types";

const AdminAlertManager = () => {
  const { user } = useUser();
  const [activeTab, setActiveTab] = useState<"alerts" | "notifications">(
    "alerts",
  );
  const [activeSelectedPostTab, setActiveSelectedPostTab] = useState<
    "comments" | "likes"
  >("comments");
  const [loading, setLoading] = useState(false);
  const [posts, setPosts] = useState<Post[]>([]);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  // Form States
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [targetResidents, setTargetResidents] = useState(true);
  const [targetSecurity, setTargetSecurity] = useState(false);
  const [alsoNotify, setAlsoNotify] = useState(true);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loadingComments, setLoadingComments] = useState(false);
  const [likes, setLikes] = useState<Like[]>([]);
  const [newComment, setNewComment] = useState("");
  const [uploadingComment, setUploadingComment] = useState(false);

  useEffect(() => {
    if (activeTab === "alerts") fetchAlerts();
  }, [activeTab]);

  const fetchAlerts = async () => {
    setLoading(true);
    try {
      const data = await communityApi.getPosts(user!.estate_id);
      setPosts(data.filter((p: any) => p.category === "Alerts"));
    } catch (err) {
      console.error("Failed to fetch alerts");
    } finally {
      setLoading(false);
    }
  };

  const handlePostAlert = async () => {
    if (!title || !content) return alert("Please fill all fields");
    setLoading(true);

    try {
      // 1. Post to Community Alerts Tab
      await communityApi.createPost({
        estate_id: user?.estate_id,
        author_name: user?.name,
        author_role: "admin",
        title: title,
        content: content,
        category: "Alerts",
        send_push: alsoNotify,
      });

      alert("Alert published successfully!");
      setTitle("");
      setContent("");
      fetchAlerts();
    } catch (err) {
      alert("Failed to post alert");
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async (postId: string) => {
    if (user && user.id) {
      setPosts(
        posts.map((p) =>
          p.id === postId
            ? {
                ...p,
                likes_count: p.has_liked
                  ? p.likes_count - 1
                  : p.likes_count + 1,
                has_liked: !p.has_liked,
              }
            : p,
        ),
      );

      await communityApi.toggleLike(postId);
    } else return;
  };

  const handleDeleteComment = async (commentId: number) => {
    // window.confirm returns true if they click "OK"
    const confirmed = window.confirm(
      "Are you sure you want to remove this comment?",
    );

    if (confirmed) {
      try {
        const response = await communityApi.deleteComment(commentId.toString());

        if (response.success) {
          setComments((prev) => prev.filter((c) => c.id !== commentId));
          // Simple success alert
          alert("Comment removed.");
        }
      } catch (error) {
        console.error("Delete Comment Error:", error);
        alert("Could not delete comment.");
      }
    }
  };

  const handleOpenPost = async (post: Post) => {
    setSelectedPost(post);
    setComments([]);
    setLikes([]);
    setLoadingComments(true);

    try {
      const [commentsData, likesData] = await Promise.all([
        communityApi.getComments(post.id),
        communityApi.getLikes(post.id),
      ]);

      setPosts((prev) =>
        prev.map((p) =>
          p.id === post.id
            ? {
                ...p,
                comments_count: commentsData.length,
                likes_count: likesData.length,
              }
            : p,
        ),
      );

      setComments(commentsData);
      setLikes(likesData);
    } catch (err) {
      console.error("Failed to load post details", err);
    } finally {
      setLoadingComments(false);
    }
  };

  const handleSendNotification = async () => {
    if (!title || !content) return alert("Content required");
    if (!targetResidents && !targetSecurity)
      return alert("Select at least one group");

    setLoading(true);
    try {
      await communityApi.sendDirectNotification({
        estate_id: user?.estate_id,
        title,
        message: content,
        targets: {
          residents: targetResidents,
          security: targetSecurity,
        },
      });

      alert("Notifications sent to selected groups!");
      setTitle("");
      setContent("");
    } catch (err) {
      alert("Failed to send notifications");
    } finally {
      setLoading(false);
    }
  };

  const handleAddComment = async (postId: string) => {
    if (!newComment.trim()) return;

    setUploadingComment(true);

    try {
      await communityApi.addComment({
        post_id: postId,
        author_name: user!.name,
        content: newComment,
      });
      await fetchAlerts();

      setNewComment("");
    } catch (error) {
      console.error("GateMan Comment Error:", error);
      alert("Failed to add comment. Please check your internet and try again.");
    } finally {
      setUploadingComment(false);
    }
  };

  // 3. Function to handle comment submission from inside the modal
  const handleCommentSubmit = async () => {
    if (!newComment.trim() || !selectedPost) return;

    await handleAddComment(selectedPost.id); // Uses your existing logic
    setNewComment("");

    // Re-fetch comments to show the new one immediately
    const updatedComments = await communityApi.getComments(selectedPost.id);
    setComments(updatedComments);
  };

  return (
    <div className="max-w-8xl mx-auto p-6">
      {/* Header & Tabs */}
      <div className="flex justify-between items-end mb-8 border-b pb-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 uppercase tracking-tight">
            Community Alert Center
          </h1>
          <p className="text-slate-500 text-sm">
            Broadcast urgent information to {user?.estate_name || "the estate"}
          </p>
        </div>

        {!selectedPost && (
          <div className="flex bg-slate-100 p-1 rounded-xl">
            <button
              onClick={() => setActiveTab("alerts")}
              className={`flex items-center gap-2 px-6 py-2 rounded-lg font-bold transition ${activeTab === "alerts" ? "bg-white shadow text-indigo-600" : "text-slate-500"}`}
            >
              <AlertTriangle size={18} /> ALERTS
            </button>
            <button
              onClick={() => setActiveTab("notifications")}
              className={`flex items-center gap-2 px-6 py-2 rounded-lg font-bold transition ${activeTab === "notifications" ? "bg-white shadow text-indigo-600" : "text-slate-500"}`}
            >
              <Bell size={18} /> NOTIFICATIONS
            </button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* LEFT COLUMN: COMPOSER */}
        <div className="lg:col-span-1 bg-white p-6 rounded-2xl shadow-sm border border-slate-100 h-fit">
          <h2 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
            {activeTab === "alerts" ? (
              <Megaphone className="text-indigo-600" />
            ) : (
              <Bell className="text-indigo-600" />
            )}
            Compose {activeTab === "alerts" ? "Public Alert" : "Direct Message"}
          </h2>

          <div className="space-y-4">
            <input
              placeholder="Subject / Title"
              className="w-full p-3 border-2 border-slate-50 rounded-xl bg-slate-50 focus:border-indigo-500 outline-none transition"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
            <textarea
              placeholder="Detailed message..."
              rows={5}
              className="w-full p-3 border-2 border-slate-50 rounded-xl bg-slate-50 focus:border-indigo-500 outline-none transition"
              value={content}
              onChange={(e) => setContent(e.target.value)}
            />

            {activeTab === "alerts" ? (
              <label className="flex items-center gap-3 p-3 bg-indigo-50 rounded-xl cursor-pointer group">
                <input
                  type="checkbox"
                  checked={alsoNotify}
                  onChange={(e) => setAlsoNotify(e.target.checked)}
                  className="w-5 h-5 accent-indigo-600"
                />
                <span className="text-sm font-bold text-indigo-900">
                  Push to Resident&apos;s Phones
                </span>
              </label>
            ) : (
              <div className="space-y-2 p-3 bg-slate-50 rounded-xl">
                <p className="text-xs font-black text-slate-400 uppercase mb-2">
                  Target Audience
                </p>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={targetResidents}
                    onChange={(e) => setTargetResidents(e.target.checked)}
                    className="accent-indigo-600"
                  />
                  <span className="text-sm font-medium">Residents</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={targetSecurity}
                    onChange={(e) => setTargetSecurity(e.target.checked)}
                    className="accent-indigo-600"
                  />
                  <span className="text-sm font-medium">Security Guards</span>
                </label>
              </div>
            )}

            <button
              onClick={
                activeTab === "alerts"
                  ? handlePostAlert
                  : handleSendNotification
              }
              disabled={loading}
              className="w-full bg-indigo-600 text-white p-4 rounded-xl font-black shadow-lg shadow-indigo-200 flex items-center justify-center gap-2 hover:bg-indigo-700 transition"
            >
              {loading ? (
                "Processing..."
              ) : (
                <>
                  {" "}
                  <Send size={18} />{" "}
                  {activeTab === "alerts" ? "PUBLISH" : "DISPATCH"}{" "}
                </>
              )}
            </button>
          </div>
        </div>

        {/* RIGHT COLUMN: HISTORY/LOGS */}
        <div className="lg:col-span-2 h-[calc(100vh-250px)] p-2 flex flex-col">
          {selectedPost ? (
            /* --- DETAIL VIEW (REPLACES LIST) --- */
            <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden animate-in fade-in slide-in-from-right-4 duration-300 flex flex-col h-full">
              {/* Detail Header */}
              <div className="p-4 border-b border-slate-50 flex items-center justify-between bg-slate-50/50 shrink-0">
                <button
                  onClick={() => setSelectedPost(null)}
                  className="flex items-center gap-2 text-slate-500 hover:text-indigo-600 font-bold transition"
                >
                  <ArrowLeft size={20} /> BACK TO LIST
                </button>
                <span className="bg-red-100 text-red-600 text-[10px] font-black px-3 py-1 rounded-full uppercase">
                  Alert Detail
                </span>
              </div>

              <div className="flex flex-col p-3">
                <h1 className="text-3xl font-black text-slate-900 mb-4">
                  {selectedPost.title}
                </h1>
                <p className="text-slate-600 text-lg leading-relaxed mb-6">
                  {selectedPost.content}
                </p>

                <div className="flex items-center gap-4 text-xs text-slate-400 border-t border-b p-2">
                  <span>By {selectedPost.author_name}</span>
                  <span>•</span>
                  <span>
                    {new Date(selectedPost.created_at).toLocaleString()}
                  </span>
                </div>
                <div className="flex bg-white border-b border-gray-100">
                  <button
                    onClick={() => setActiveSelectedPostTab("comments")}
                    className={`flex-1 py-3 items-center ${activeSelectedPostTab === "comments" ? "bg-indigo-600" : ""}`}
                  >
                    <p
                      className={`text-xs font-bold uppercase tracking-widest ${activeSelectedPostTab === "comments" ? "text-white" : "text-gray-400"}`}
                    >
                      Comments ({comments?.length ?? 0})
                    </p>
                  </button>
                  <button
                    onClick={() => setActiveSelectedPostTab("likes")}
                    className={`flex-1 py-3 items-center ${activeSelectedPostTab === "likes" ? "bg-indigo-600" : ""}`}
                  >
                    <p
                      className={`text-xs font-bold uppercase tracking-widest ${activeSelectedPostTab === "likes" ? "text-white" : "text-gray-400"}`}
                    >
                      Likes ({likes?.length ?? 0})
                    </p>
                  </button>
                </div>
              </div>
              {/* Detail Content - SCROLLABLE CONTENT AREA */}
              <div className="p-2 overflow-y-auto flex-1">
                {activeSelectedPostTab === "likes" ? (
                  <div className="flex-1 p-4">
                    {loadingComments ? (
                      <div className="flex-1 p-4 flex justify-center items-center">
                        <Loader2 size="small" color="#4f46e5" />
                      </div>
                    ) : likes.length > 0 ? (
                      likes.map((like: any, index: number) => (
                        <div
                          key={index}
                          className="flex-row items-center mb-3 bg-white p-3 rounded-2xl border border-gray-100 shadow-sm"
                        >
                          {/* Avatar Initial */}
                          <div className="flex gap-3 items-center">
                            <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center mr-3 border border-indigo-100">
                              <p className="text-indigo-600 font-bold text-sm">
                                {like.author_name?.charAt(0).toUpperCase() ||
                                  "U"}
                              </p>
                            </div>

                            <p className="text-sm font-bold text-gray-900">
                              {like.author_name}
                            </p>
                          </div>

                          <div className="flex-1 mt-2">
                            <p className="text-[10px] text-gray-400">
                              Liked {getRelativeTime(like.created_at)}
                            </p>
                          </div>

                          {/* Heart indicator */}
                          <div className="p-2 rounded-full">
                            <Heart size={12} color="#ef4444" fill="#ef4444" />
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="items-center py-10">
                        <p className="text-gray-400 text-xs">No likes yet</p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex-1 p-4">
                    {comments.length > 0 ? (
                      comments.map((comment: any) => (
                        <div
                          key={comment.id}
                          className="mb-3 bg-white p-3 rounded-2xl shadow-sm border border-gray-100"
                        >
                          <p className="font-bold text-xs text-indigo-600">
                            {comment.author_name}
                          </p>
                          <p className="text-gray-800 py-1 text-sm">
                            {comment.content}
                          </p>
                          <div className="flex-row justify-between w-full">
                            <p className="text-[9px] text-gray-400">
                              {getRelativeTime(comment.created_at)}
                            </p>
                            {comment.user_id === user?.id && (
                              <button
                                onClick={() => handleDeleteComment(comment.id)}
                              >
                                <Trash size={14} color="red" />
                              </button>
                            )}
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="items-center py-10">
                        <p className="text-gray-400 text-xs">No comments yet</p>
                      </div>
                    )}
                    <div className="h-10" />
                  </div>
                )}
              </div>

              {/* Stats - STICKY BOTTOM */}
              <div className="pl-3 bg-slate-50 flex gap-6 border-t shrink-0">
                <div className="flex gap-3 h-12 items-center">
                  <div className="flex items-center gap-2 text-slate-500">
                    <MessageSquare size={18} />{" "}
                    <span className="font-bold">
                      {comments.length} Comments
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-500">
                    <Heart size={18} />{" "}
                    <span className="font-bold">{likes.length} Likes</span>
                  </div>
                </div>
                {activeSelectedPostTab === "comments" && (
                  <div className="border-t border-gray-100 bg-white flex-1">
                    <div className="flex items-center px-4 h-12">
                      <input
                        className="flex-1 text-sm text-gray-900 bg-gray-100 rounded-2xl p-2"
                        placeholder="Write a comment..."
                        value={newComment}
                        onChange={(e) => {
                          setNewComment(e.target.value);
                        }}
                      />
                      <button
                        onClick={handleCommentSubmit}
                        disabled={uploadingComment}
                        className="ml-2 bg-indigo-600 rounded-full p-2"
                      >
                        {uploadingComment ? (
                          <Loader size="small" color="white" />
                        ) : (
                          <Send size={16} color="white" />
                        )}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* --- LIST VIEW --- */
            <div className="flex flex-col h-full">
              <div className="flex justify-between items-center mb-4 shrink-0">
                <h3 className="font-bold text-slate-400 uppercase text-xs tracking-widest">
                  Recent {activeTab} Activity
                </h3>
              </div>

              {/* SCROLLABLE LIST AREA */}
              <div className="space-y-4 overflow-y-auto pr-2 custom-scrollbar flex-1">
                {activeTab === "alerts" ? (
                  posts.length > 0 ? (
                    posts.map((post) => (
                      <div
                        key={post.id}
                        onClick={() => handleOpenPost(post)}
                        className="bg-white p-5 rounded-2xl border border-slate-100 flex justify-between items-start cursor-pointer hover:border-indigo-200 transition"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="bg-red-100 text-red-600 text-[10px] font-black px-2 py-0.5 rounded">
                              ALERT
                            </span>
                            <h4 className="font-bold text-slate-900">
                              {post.title}
                            </h4>
                          </div>
                          <p className="text-slate-600 text-sm mb-3 line-clamp-2">
                            {post.content}
                          </p>
                          <p className="text-[10px] text-slate-400 font-medium">
                            Published on{" "}
                            {new Date(post.created_at).toLocaleString()}
                          </p>
                          <div className="flex items-center justify-between my-3">
                            <button
                              className="flexitems-center"
                              onClick={() => handleLike(post.id)}
                            >
                              <ThumbsUp
                                size={18}
                                color={post.has_liked ? "#2563eb" : "#9ca3af"}
                              />
                              <p className="ml-1 font-bold text-sm">
                                {post.likes_count}
                              </p>
                            </button>
                            <div className="flex items-center">
                              <MessageSquare size={18} color="#9ca3af" />
                              <p className="ml-1 font-bold text-sm">
                                {post.comments_count}
                              </p>
                            </div>
                          </div>
                        </div>
                        <button className="text-slate-300 hover:text-red-500 transition">
                          <Trash2 size={18} />
                        </button>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-20 bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200">
                      <Info className="mx-auto text-slate-300 mb-2" />
                      <p className="text-slate-400 font-bold">
                        No active alerts found.
                      </p>
                    </div>
                  )
                ) : (
                  <div className="bg-blue-50 p-6 rounded-2xl border border-blue-100">
                    {/* Notification content */}
                    <div className="flex gap-4">
                      <div className="bg-blue-600 p-3 rounded-xl h-fit text-white">
                        <CheckCircle2 size={24} />
                      </div>
                      <div>
                        <h4 className="font-bold text-blue-900">
                          Direct Notification Mode
                        </h4>
                        <p className="text-blue-700 text-sm mt-1">
                          Messages sent here do not appear on the community
                          board.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminAlertManager;
