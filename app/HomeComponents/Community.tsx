/* eslint-disable @next/next/no-img-element */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useEffect } from "react";
import {
  Bell,
  Megaphone,
  Send,
  Trash2,
  MessageSquare,
  Heart,
  ArrowLeft,
  ThumbsUp,
  Loader,
  Trash,
  Loader2,
  ImageIcon,
  X,
  Archive,
  Users,
  Search,
} from "lucide-react";
import {
  communityApi,
  getCloudinaryUrl,
  getRelativeTime,
} from "../services/apis";
import { useUser } from "../UserContext";
import { Like, Post, Comment } from "../services/types";

const AdminAlertManager = () => {
  const { user } = useUser();
  const [activeTab, setActiveTab] = useState<"communication" | "notifications">(
    "communication",
  );
  const [activeSelectedPostTab, setActiveSelectedPostTab] = useState<
    "comments" | "likes"
  >("comments");
  const [loading, setLoading] = useState(false);
  const [posts, setPosts] = useState<Post[]>([]);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);

  // Archive & Search View States
  const [searchQuery, setSearchQuery] = useState("");
  const [showArchived, setShowArchived] = useState(false);

  // Form States
  const [selectedImage, setSelectedImage] = useState<any>(null);
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
  const [publishing, setPublishing] = useState(false);
  const [notificationType, setNotificationType] = useState("announcement");
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;

  useEffect(() => {
    if (!selectedImage) return;
    const objectUrl = URL.createObjectURL(selectedImage);
    return () => URL.revokeObjectURL(objectUrl);
  }, [selectedImage]);

  const fetchPosts = async () => {
    setLoading(true);
    try {
      const data = await communityApi.getPosts(user!.estate_id);
      setPosts(data || []);
    } catch (err) {
      console.error("Failed to fetch alerts");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === "communication" && user?.estate_id) {
      fetchPosts();
    }
  }, [activeTab, user?.estate_id]);

  // Frontend Filter: Handles text matching and is_archived toggle status
  const filteredPosts = posts.filter((post) => {
    const matchesSearch =
      post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.content.toLowerCase().includes(searchQuery.toLowerCase());

    const postIsArchived = !!(post.is_archived || (post as any).archived);
    const matchesArchiveStatus = postIsArchived === showArchived;

    return matchesSearch && matchesArchiveStatus;
  });

  const handlePostAlert = async () => {
    if (!title || !content) return alert("Please fill all fields");
    setPublishing(true);

    try {
      let uploadedUrl = "";

      if (selectedImage) {
        const url = await getCloudinaryUrl(selectedImage, "image");
        if (url) uploadedUrl = url;
      }

      await communityApi.createPost({
        author_name: "ADMIN",
        author_role: "admin",
        title: title,
        content: content,
        category: "General",
        image_url: uploadedUrl,
        thumbnail_url: uploadedUrl,
        send_push: alsoNotify,
      });

      alert("Post published successfully!");
      setTitle("");
      setContent("");
      setSelectedImage(null);
      fetchPosts();
    } catch (err) {
      console.error(err);
      alert("Failed to post alert");
    } finally {
      setPublishing(false);
    }
  };

  const handleSendNotification = async () => {
    if (!title || !content) return alert("Content required");
    if (!targetResidents && !targetSecurity)
      return alert("Select at least one group");

    setPublishing(true);
    try {
      await communityApi.sendDirectNotification({
        title,
        message: content,
        targets: {
          residents: targetResidents,
          security: targetSecurity,
        },
        type: notificationType,
      });

      alert("Notifications sent to selected groups!");
      setTitle("");
      setContent("");
    } catch (err) {
      alert("Failed to send notifications");
    } finally {
      setPublishing(false);
    }
  };

  const handleLike = async (postId: string) => {
    if (!user?.id) return;
    const isUnliking = selectedPost?.has_liked;

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

      if (selectedPost && selectedPost.id === postId) {
        setSelectedPost({
          ...selectedPost,
          likes_count: selectedPost.has_liked
            ? selectedPost.likes_count - 1
            : selectedPost.likes_count + 1,
          has_liked: !selectedPost.has_liked,
        });
      }

      if (isUnliking) {
        setLikes((prev) => prev.filter((l) => l.user_id !== user.id));
      } else {
        const adminLike = {
          user_id: user.id,
          author_name: "ADMIN",
          user_type: "admin",
          created_at: new Date().toISOString(),
        };
        setLikes((prev) => [adminLike, ...prev]);
      }

      await communityApi.toggleLike(postId);
    } else return;
  };

  const handleDeleteComment = async (commentId: number) => {
    if (!window.confirm("Are you sure you want to remove this comment?"))
      return;

    const previousComments = [...comments];
    setComments((prev) => prev.filter((c) => c.id !== commentId));

    setPosts((prev) =>
      prev.map((p) =>
        p.id === selectedPost?.id
          ? { ...p, comments_count: Math.max(0, p.comments_count - 1) }
          : p,
      ),
    );

    if (selectedPost) {
      setSelectedPost({
        ...selectedPost,
        comments_count: Math.max(0, selectedPost.comments_count - 1),
      });
    }

    try {
      const response = await communityApi.deleteComment(commentId.toString());
      if (!response.success) throw new Error("Failed");
    } catch (error) {
      console.error("Delete Comment Error:", error);
      alert("Could not delete comment. Reverting...");
      setComments(previousComments);
      fetchPosts();
    }
  };

  const handleOpenPost = async (post: Post) => {
    setSelectedPost(post);

    if (!post.admin_seen) {
      setPosts((prevPosts) =>
        prevPosts.map((p) =>
          p.id === post.id ? { ...p, admin_seen: true } : p,
        ),
      );

      fetch(`${baseUrl}/api/community/posts/${post.id}/seen`, {
        method: "PATCH",
        credentials: "include",
      }).catch((err) => console.error("Sync failed:", err));
    }

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

  const handleAddComment = async (postId: string) => {
    if (!newComment.trim()) return;

    const commentText = newComment;
    setNewComment("");
    setUploadingComment(true);

    const optimisticComment: Comment = {
      id: Date.now(),
      post_id: Number(postId),
      user_id: user?.id || "",
      user_type: "admin",
      author_name: "ADMIN",
      content: commentText,
      created_at: new Date().toISOString(),
    };

    setComments((prev) => [...prev, optimisticComment]);

    setPosts((prev) =>
      prev.map((p) =>
        p.id === postId ? { ...p, comments_count: p.comments_count + 1 } : p,
      ),
    );

    if (selectedPost && selectedPost.id === postId) {
      setSelectedPost({
        ...selectedPost,
        comments_count: selectedPost.comments_count + 1,
      });
    }

    try {
      const response = await communityApi.addComment({
        post_id: postId,
        content: commentText,
      });

      setComments((prev) =>
        prev.map((c) => (c.id === optimisticComment.id ? response : c)),
      );
    } catch (error) {
      console.error("GateMan Comment Error:", error);
      alert("Failed to add comment.");
      fetchPosts();
    } finally {
      setUploadingComment(false);
    }
  };

  const handleCommentSubmit = async () => {
    if (!newComment.trim() || !selectedPost) return;

    await handleAddComment(selectedPost.id);
    setNewComment("");

    const updatedComments = await communityApi.getComments(selectedPost.id);
    setComments(updatedComments);
  };

  const handleArchivePost = async (postId: string) => {
    const actionLabel = showArchived ? "Unarchive" : "Archive";
    const confirmed = window.confirm(
      `${actionLabel} Post\nAre you sure you want to change this post's visibility status?`,
    );

    if (!confirmed) return;

    try {
      const response = await communityApi.archivePost(postId.toString());
      if (response.success || response) {
        alert(`Post ${actionLabel.toLowerCase()}d successfully.`);

        setPosts((prevPosts) =>
          prevPosts.map((p) =>
            p.id === postId ? { ...p, is_archived: !showArchived } : p,
          ),
        );

        if (selectedPost && selectedPost.id === postId) {
          setSelectedPost(null);
        }
      }
    } catch (err) {
      console.error("Archive UI handler failure:", err);
      alert("Could not complete archiving action.");
    }
  };

  const handleDelete = async (postId: string) => {
    const confirmed = window.confirm(
      "Delete Post\nAre you sure you want to remove this post permanently?",
    );

    if (confirmed) {
      try {
        const response = await communityApi.deletePost(postId.toString());
        if (response.success || response) {
          setPosts((prevPosts) => prevPosts.filter((p) => p.id !== postId));
          alert("Post deleted successfully.");
        }
      } catch (error: any) {
        console.error("Delete Error:", error);
        alert("Could not delete post. Please try again.");
      }
    }
  };

  return (
    <div className="max-w-8xl mx-auto p-6 overflow-hidden">
      {/* Header & Tabs */}
      <div className="flex justify-between items-end mb-8 border-b pb-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 uppercase tracking-tight">
            Community Alert Center
          </h1>
          <p className="text-slate-500 text-sm">
            Broadcast urgent information to the estate
          </p>
        </div>

        {!selectedPost && (
          <div className="flex bg-slate-100 p-1 rounded-xl">
            <button
              onClick={() => setActiveTab("communication")}
              className={`flex items-center gap-2 px-6 py-2 rounded-lg font-bold transition ${activeTab === "communication" ? "bg-white shadow text-indigo-600" : "text-slate-500"}`}
            >
              <Users size={18} /> COMMUNICATION BOARD
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
            {activeTab === "communication" ? (
              <Megaphone className="text-indigo-600" />
            ) : (
              <Bell className="text-indigo-600" />
            )}
            Compose{" "}
            {activeTab === "communication" ? "Public Alert" : "Direct Message"}
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

            {/* Image Upload UI */}
            {activeTab === "communication" ? (
              <div className="space-y-2">
                <p className="text-xs font-black text-slate-400 uppercase">
                  Attachment
                </p>

                {!selectedImage ? (
                  <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-slate-200 rounded-xl bg-slate-50 cursor-pointer hover:bg-slate-100 hover:border-indigo-300 transition group">
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <ImageIcon className="w-8 h-8 text-slate-400 group-hover:text-indigo-500 mb-2" />
                      <p className="text-sm text-slate-500">
                        Click to upload photo
                      </p>
                    </div>
                    <input
                      type="file"
                      className="hidden"
                      accept="image/*"
                      onChange={(e) => setSelectedImage(e.target.files?.[0])}
                    />
                  </label>
                ) : (
                  <div className="relative rounded-xl overflow-hidden border-2 border-indigo-100">
                    <img
                      src={URL.createObjectURL(selectedImage)}
                      alt="Preview"
                      className="w-full h-40 object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => setSelectedImage(null)}
                      className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full hover:bg-red-600 shadow-md"
                    >
                      <X size={16} />
                    </button>
                  </div>
                )}
              </div>
            ) : null}

            {activeTab === "communication" ? (
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
              <div className="space-y-4 p-3 bg-slate-50 rounded-xl">
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
                activeTab === "communication"
                  ? handlePostAlert
                  : handleSendNotification
              }
              disabled={loading}
              className="w-full bg-indigo-600 text-white p-4 rounded-xl font-black shadow-lg shadow-indigo-200 flex items-center justify-center gap-2 hover:bg-indigo-700 transition"
            >
              {publishing ? (
                "Processing..."
              ) : (
                <>
                  <Send size={18} />
                  {activeTab === "communication" ? "PUBLISH" : "DISPATCH"}
                </>
              )}
            </button>
          </div>
        </div>

        {/* RIGHT COLUMN: HISTORY/LOGS */}
        <div className="lg:col-span-2 h-[calc(100vh-250px)] p-2 flex flex-col">
          {selectedPost ? (
            /* --- DETAIL VIEW --- */
            <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden animate-in fade-in slide-in-from-right-4 duration-300 flex flex-col h-full">
              <div className="p-4 border-b border-slate-50 flex items-center justify-between bg-slate-50/50 shrink-0">
                <button
                  onClick={() => {
                    setSelectedPost(null);
                    setActiveSelectedPostTab("comments");
                  }}
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
                      Likes ({likes.length ?? 0})
                    </p>
                  </button>
                </div>
              </div>

              <div className="p-2 overflow-y-auto flex-1">
                {loadingComments ? (
                  <div className="flex flex-col items-center justify-center py-20">
                    <Loader2
                      size={24}
                      className="text-indigo-600 animate-spin"
                    />
                    <p className="text-slate-400 text-xs mt-2 font-medium">
                      Loading details...
                    </p>
                  </div>
                ) : activeSelectedPostTab === "likes" ? (
                  <div className="flex-1 p-4">
                    {likes.length > 0 ? (
                      likes.map((like: any, index: number) => (
                        <div
                          key={index}
                          className="flex items-center justify-between mb-3 bg-white p-3 rounded-2xl border border-gray-100 shadow-sm"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center border border-indigo-100">
                              <p className="text-indigo-600 font-bold text-sm">
                                {like.author_name?.charAt(0).toUpperCase() ||
                                  "U"}
                              </p>
                            </div>
                            <div>
                              <p className="text-sm font-bold text-gray-900">
                                {like.author_name}
                              </p>
                              <p className="text-[10px] text-gray-400">
                                Liked {getRelativeTime(like.created_at)}
                              </p>
                            </div>
                          </div>
                          <Heart
                            size={14}
                            className="text-red-500 fill-red-500"
                          />
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-10">
                        <p className="text-gray-400 text-xs font-bold uppercase tracking-widest">
                          No likes yet
                        </p>
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
                          <div className="flex justify-between items-center w-full">
                            <p className="text-[9px] text-gray-400">
                              {getRelativeTime(comment.created_at)}
                            </p>
                            {comment.user_id === user?.id && (
                              <button
                                onClick={() => handleDeleteComment(comment.id)}
                                className="p-1 hover:bg-red-50 rounded-lg transition"
                              >
                                <Trash size={14} className="text-red-500" />
                              </button>
                            )}
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-10">
                        <p className="text-gray-400 text-xs font-bold uppercase tracking-widest">
                          No comments yet
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="pl-3 bg-slate-50 flex gap-6 border-t shrink-0">
                <div className="flex gap-3 h-12 items-center">
                  <button
                    className="flex justify-center items-center"
                    onClick={() => handleLike(selectedPost.id)}
                  >
                    <ThumbsUp
                      size={18}
                      color={selectedPost.has_liked ? "#2563eb" : "#9ca3af"}
                    />
                  </button>
                </div>
                {activeSelectedPostTab === "comments" && (
                  <div className="border-t border-gray-100 bg-white flex-1">
                    <div className="flex items-center px-4 h-12">
                      <input
                        className="flex-1 text-sm text-gray-900 bg-gray-100 rounded-2xl p-2"
                        placeholder="Write a comment..."
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                      />
                      <button
                        onClick={handleCommentSubmit}
                        disabled={uploadingComment}
                        className="ml-2 bg-indigo-600 rounded-full w-10 h-10 flex items-center justify-center transition-all disabled:opacity-70"
                      >
                        {uploadingComment ? (
                          <Loader
                            size={18}
                            className="text-white animate-spin"
                          />
                        ) : (
                          <Send size={16} className="text-white" />
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
                  {showArchived
                    ? "Archived Logs"
                    : `Recent ${activeTab} Activity`}
                </h3>
              </div>

              {activeTab === "communication" && (
                <div className="flex flex-col sm:flex-row gap-3 bg-slate-50 p-3 pr-9 rounded-2xl border border-slate-100 shrink-0">
                  {/* Search Input Bar */}
                  <div className="flex-1 relative flex items-center">
                    <Search
                      size={16}
                      className="absolute left-3 text-slate-400"
                    />
                    <input
                      type="text"
                      placeholder="Search board entries..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full text-xs pl-9 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl outline-none focus:border-indigo-500 transition"
                    />
                    {searchQuery && (
                      <button
                        onClick={() => setSearchQuery("")}
                        className="absolute right-3 text-slate-400 hover:text-slate-600"
                      >
                        <X size={14} />
                      </button>
                    )}
                  </div>

                  <button
                    onClick={() => setShowArchived(!showArchived)}
                    className={`flex items-center gap-2 px-4 py-2 border rounded-xl text-xs font-bold transition whitespace-nowrap bg-white ${
                      showArchived
                        ? "border-indigo-200 text-indigo-600 hover:bg-indigo-50/50"
                        : "border-slate-200 text-slate-600 hover:bg-slate-100"
                    }`}
                  >
                    <Archive
                      size={14}
                      className={
                        showArchived ? "text-indigo-600" : "text-slate-400"
                      }
                    />
                    <span>
                      {showArchived ? "Feed" : "View Archives"}
                    </span>
                  </button>
                </div>
              )}

              {/* SCROLLABLE FEED LIST AREA */}
              <div className="space-y-4 overflow-y-auto pr-2 custom-scrollbar flex-1 mt-2">
                {activeTab === "communication" ? (
                  filteredPosts.length > 0 ? (
                    filteredPosts.map((post) => (
                      <div
                        key={post.id}
                        className="bg-white p-5 rounded-2xl border border-slate-100 flex justify-between items-start cursor-pointer hover:border-indigo-200 transition animate-in fade-in duration-200"
                      >
                        <div
                          className="flex-1"
                          onClick={() => handleOpenPost(post)}
                        >
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-bold text-slate-900">
                              {post.title}
                            </h4>
                            {!post.admin_seen && !showArchived && (
                              <div className="bg-red-600 text-white text-[9px] font-black px-2 py-0.5 rounded shadow-sm animate-pulse">
                                NEW
                              </div>
                            )}
                          </div>
                          <p className="text-slate-600 text-sm mb-3 line-clamp-2">
                            {post.content}
                          </p>
                          <p className="text-[10px] text-slate-400 font-medium">
                            Published on{" "}
                            {new Date(post.created_at).toLocaleString()}
                          </p>
                          <div className="flex items-center gap-6 my-3 text-slate-500">
                            <span className="flex items-center gap-1">
                              <ThumbsUp
                                size={16}
                                className={
                                  post.has_liked
                                    ? "text-indigo-600 fill-indigo-100"
                                    : "text-slate-400"
                                }
                              />
                              <p className="font-bold text-xs">
                                {post.likes_count}
                              </p>
                            </span>
                            <span className="flex items-center gap-1">
                              <MessageSquare
                                size={16}
                                className="text-slate-400"
                              />
                              <p className="font-bold text-xs">
                                {post.comments_count}
                              </p>
                            </span>
                          </div>
                        </div>

                        <div className="flex flex-col gap-2 ml-4 self-start">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleArchivePost(post.id);
                            }}
                            className={`p-1.5 rounded-lg transition ${
                              showArchived
                                ? "text-indigo-600 hover:bg-indigo-50"
                                : "text-slate-400 hover:text-amber-600 hover:bg-amber-50"
                            }`}
                            title={
                              showArchived
                                ? "Restore to public feed"
                                : "Archive notice"
                            }
                          >
                            <Archive size={16} />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDelete(post.id);
                            }}
                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                            title="Delete Post"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-20 text-slate-400 text-sm font-medium bg-white rounded-2xl border border-slate-100">
                      {showArchived
                        ? "Archive board history is empty."
                        : "No active announcements published here yet."}
                    </div>
                  )
                ) : (
                  <div className="text-center py-20 text-slate-400 text-sm font-medium bg-white rounded-2xl border border-slate-100">
                    No system dispatch logs tracked under this category.
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
