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
import { useRouter } from "next/navigation";

const AdminAlertManager = () => {
  const { user } = useUser();
  const router = useRouter();
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
    <div className="max-w-8xl mx-auto p-4 sm:p-6 overflow-hidden font-sans">
      {/* Dynamic Master Board Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end gap-4 mb-8 border-b border-slate-200/60 pb-5 min-w-0">
        <div className="min-w-0">
          <h1 className="text-2xl sm:text-3xl font-montserrat font-black text-slate-800 tracking-tight uppercase">
            Community Alert Center
          </h1>
          <p className="text-slate-400 text-xs sm:text-sm font-medium mt-0.5">
            Broadcast urgent information and dispatch notices across the estate
          </p>
        </div>

        {!selectedPost && (
          <div className="flex bg-slate-200/60 p-1 rounded-xl w-full sm:w-fit shrink-0 border border-slate-200/20">
            <button
              onClick={() => setActiveTab("communication")}
              className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 sm:px-5 py-2 rounded-lg font-montserrat font-bold text-xs uppercase tracking-wider transition-all duration-200 ${activeTab === "communication" ? "bg-white shadow-2xs text-blue-600" : "text-slate-500 hover:text-slate-700"}`}
            >
              <Users size={14} /> Communication Board
            </button>
            <button
              onClick={() => setActiveTab("notifications")}
              className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 sm:px-5 py-2 rounded-lg font-montserrat font-bold text-xs uppercase tracking-wider transition-all duration-200 ${activeTab === "notifications" ? "bg-white shadow-2xs text-blue-600" : "text-slate-500 hover:text-slate-700"}`}
            >
              <Bell size={14} /> Notifications
            </button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
        {/* LEFT COMPOSER WINDOW BAR PANEL */}
        <div className="lg:col-span-1 bg-white p-5 sm:p-6 rounded-2xl shadow-2xs border border-slate-200/70 h-fit">
          <h2 className="font-montserrat font-bold text-slate-800 mb-4 flex items-center gap-2 text-sm uppercase tracking-wide">
            {activeTab === "communication" ? (
              <Megaphone size={16} className="text-blue-600" />
            ) : (
              <Bell size={16} className="text-blue-600" />
            )}
            Compose{" "}
            {activeTab === "communication" ? "Public Alert" : "Direct Message"}
          </h2>

          <div className="space-y-4 font-sans">
            <input
              placeholder="Subject / Title"
              className="w-full p-3 text-sm border border-slate-200 rounded-xl bg-slate-50/50 focus:bg-white focus:border-blue-500/80 outline-none transition-all placeholder:text-slate-400 font-medium text-slate-700"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
            <textarea
              placeholder="Detailed message description..."
              rows={5}
              className="w-full p-3 text-sm border border-slate-200 rounded-xl bg-slate-50/50 focus:bg-white focus:border-blue-500/80 outline-none transition-all placeholder:text-slate-400 font-medium text-slate-700 resize-none"
              value={content}
              onChange={(e) => setContent(e.target.value)}
            />

            {/* Media Attachment Node Component Context */}
            {activeTab === "communication" ? (
              <div className="space-y-1.5">
                <p className="text-[10px] font-oswald font-bold text-slate-400 uppercase tracking-wider">
                  Media Attachment
                </p>

                {!selectedImage ? (
                  <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-slate-200 rounded-xl bg-slate-50/50 cursor-pointer hover:bg-slate-100/50 hover:border-blue-400/50 transition-all group">
                    <div className="flex flex-col items-center justify-center pt-4 pb-4 px-4 text-center">
                      <ImageIcon className="w-7 h-7 text-slate-400 group-hover:text-blue-500 mb-2 transition-colors" />
                      <p className="text-xs text-slate-500 font-medium">
                        Click to append layout graphic
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
                  <div className="relative rounded-xl overflow-hidden border border-blue-100 bg-slate-50">
                    <img
                      src={URL.createObjectURL(selectedImage)}
                      alt="Preview"
                      className="w-full h-36 object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => setSelectedImage(null)}
                      className="absolute top-2 right-2 bg-rose-600 hover:bg-rose-700 text-white p-1.5 rounded-full shadow-md transition-colors"
                    >
                      <X size={14} />
                    </button>
                  </div>
                )}
              </div>
            ) : null}

            {activeTab === "communication" ? (
              <label className="flex items-center gap-3 p-3 bg-blue-50/40 border border-blue-100/20 rounded-xl cursor-pointer group transition-colors hover:bg-blue-50/70">
                <input
                  type="checkbox"
                  checked={alsoNotify}
                  onChange={(e) => setAlsoNotify(e.target.checked)}
                  className="w-4 h-4 accent-blue-600 rounded-md"
                />
                <span className="text-xs font-montserrat font-bold text-blue-900 uppercase tracking-wide">
                  Push to Resident&apos;s Devices
                </span>
              </label>
            ) : (
              <div className="space-y-3 p-3 bg-slate-50/80 border border-slate-100 rounded-xl">
                <p className="text-[10px] font-oswald font-bold text-slate-400 uppercase tracking-wider">
                  Target Destination Scope
                </p>
                <div className="flex flex-col gap-2">
                  <label className="flex items-center gap-2.5 cursor-pointer text-xs font-semibold text-slate-700">
                    <input
                      type="checkbox"
                      checked={targetResidents}
                      onChange={(e) => setTargetResidents(e.target.checked)}
                      className="accent-blue-600 w-4 h-4 rounded"
                    />
                    <span>Community Residents</span>
                  </label>
                  <label className="flex items-center gap-2.5 cursor-pointer text-xs font-semibold text-slate-700">
                    <input
                      type="checkbox"
                      checked={targetSecurity}
                      onChange={(e) => setTargetSecurity(e.target.checked)}
                      className="accent-blue-600 w-4 h-4 rounded"
                    />
                    <span>On-Duty Security guards</span>
                  </label>
                </div>
              </div>
            )}

            <button
              onClick={
                activeTab === "communication"
                  ? handlePostAlert
                  : handleSendNotification
              }
              disabled={loading}
              className="w-full bg-blue-600 text-white p-3.5 rounded-xl font-montserrat font-bold text-xs uppercase tracking-wider shadow-md shadow-blue-100 flex items-center justify-center gap-2 hover:bg-blue-700 transition-all active:scale-98"
            >
              {publishing ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  <span>Processing Board Write...</span>
                </>
              ) : (
                <>
                  <Send size={13} />
                  <span>
                    {activeTab === "communication"
                      ? "Publish Entry"
                      : "Dispatch Notification"}
                  </span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* RIGHT HISTORICAL LOG STREAM VIEWS */}
        <div className="lg:col-span-2 h-[calc(100vh-250px)] p-1 flex flex-col min-w-0">
          {selectedPost ? (
            /* --- EXPANDED DETAIL COMPONENT VIEW --- */
            <div className="bg-white rounded-2xl border border-slate-200/70 shadow-2xs overflow-hidden flex flex-col h-full min-w-0 animate-fade-in">
              <div className="p-4 border-b border-slate-200/60 flex items-center justify-between bg-slate-50/50 shrink-0 min-w-0">
                <button
                  onClick={() => {
                    setSelectedPost(null);
                    setActiveSelectedPostTab("comments");
                  }}
                  className="flex items-center gap-1.5 text-slate-500 hover:text-blue-600 font-montserrat font-bold text-xs uppercase tracking-wider transition-colors min-w-0"
                >
                  <ArrowLeft size={16} /> Back to dashboard feed
                </button>
                <span className="bg-blue-50 border border-blue-100/50 text-blue-600 text-[10px] font-oswald font-bold px-2.5 py-0.5 rounded-md uppercase tracking-wider shrink-0">
                  Alert Detail View
                </span>
              </div>

              {/* Detail Content Metadata Track */}
              <div className="flex flex-col p-5 border-b border-slate-100 shrink-0 min-w-0">
                <h3 className="text-xl sm:text-2xl font-montserrat font-black text-slate-800 tracking-tight leading-snug truncate block w-full mb-2">
                  {selectedPost.title}
                </h3>
                <p className="text-slate-600 text-sm leading-relaxed mb-4 max-h-24 overflow-y-auto font-medium">
                  {selectedPost.content}
                </p>

                <div className="flex flex-wrap items-center gap-3 text-[11px] font-medium text-slate-400 bg-slate-50/80 p-2.5 rounded-xl border border-slate-100">
                  <div className="flex items-center gap-1">
                    <span>Author:</span>
                    <button
                      onClick={() => {
                        router.push(
                          `/home/tenantmanagement?author_id=${selectedPost.author_id}`,
                        );
                      }}
                      className="font-montserrat font-bold text-blue-600 hover:text-blue-800 hover:underline transition-all"
                    >
                      {selectedPost.author_name}
                    </button>
                  </div>
                  <span className="text-slate-300">•</span>
                  <span className="font-oswald tracking-wide font-semibold text-slate-500">
                    {new Date(selectedPost.created_at).toLocaleString()}
                  </span>
                </div>

                {/* Internal Comment/Like Component Navigation Header Track */}
                <div className="flex bg-slate-50 border border-slate-200/60 p-0.5 rounded-xl mt-4 shrink-0">
                  <button
                    onClick={() => setActiveSelectedPostTab("comments")}
                    className={`flex-1 py-2 rounded-lg font-montserrat font-bold text-xs uppercase tracking-wider transition-all duration-200 flex items-center justify-center gap-2 ${activeSelectedPostTab === "comments" ? "bg-white text-blue-600 shadow-3xs" : "text-slate-400 hover:text-slate-600"}`}
                  >
                    <span>Comments</span>
                    <span className="font-oswald text-[10px] px-1.5 py-0.5 rounded bg-slate-200/60 text-slate-600 font-bold">
                      {comments?.length ?? 0}
                    </span>
                  </button>
                  <button
                    onClick={() => setActiveSelectedPostTab("likes")}
                    className={`flex-1 py-2 rounded-lg font-montserrat font-bold text-xs uppercase tracking-wider transition-all duration-200 flex items-center justify-center gap-2 ${activeSelectedPostTab === "likes" ? "bg-white text-blue-600 shadow-3xs" : "text-slate-400 hover:text-slate-600"}`}
                  >
                    <span>Likes</span>
                    <span className="font-oswald text-[10px] px-1.5 py-0.5 rounded bg-slate-200/60 text-slate-600 font-bold">
                      {likes?.length ?? 0}
                    </span>
                  </button>
                </div>
              </div>

              {/* Parameter Metadata Dynamic Render Sheet Scroll Track */}
              <div className="p-4 overflow-y-auto flex-1 bg-slate-50/30 custom-scrollbar">
                {loadingComments ? (
                  <div className="flex flex-col items-center justify-center py-16">
                    <Loader2 size={20} className="text-blue-600 animate-spin" />
                    <p className="text-slate-400 text-xs mt-2 font-medium">
                      Compiling register activity logs...
                    </p>
                  </div>
                ) : activeSelectedPostTab === "likes" ? (
                  <div className="space-y-2.5">
                    {likes.length > 0 ? (
                      likes.map((like: any, index: number) => (
                        <div
                          key={index}
                          className="flex items-center justify-between bg-white p-3 rounded-xl border border-slate-200/60 shadow-3xs min-w-0"
                        >
                          <div className="flex items-center gap-3 min-w-0 flex-1">
                            <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center border border-blue-100/50 shrink-0">
                              <p className="text-blue-600 font-montserrat font-black text-sm uppercase">
                                {like.author_name?.charAt(0).toUpperCase() ||
                                  "U"}
                              </p>
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-montserrat font-bold text-slate-800 truncate block w-full">
                                {like.author_name}
                              </p>
                              <p className="text-[10px] text-slate-400 font-oswald font-medium tracking-wide">
                                LIKED{" "}
                                {getRelativeTime(like.created_at).toUpperCase()}
                              </p>
                            </div>
                          </div>
                          <Heart
                            size={14}
                            className="text-rose-500 fill-rose-500 shrink-0 mr-1"
                          />
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-12 border border-dashed border-slate-200 rounded-xl bg-white">
                        <p className="text-slate-400 text-xs font-montserrat font-bold uppercase tracking-wider">
                          No likes registered
                        </p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {comments.length > 0 ? (
                      comments.map((comment: any) => (
                        <div
                          key={comment.id}
                          className="bg-white p-3.5 rounded-xl border border-slate-200/60 shadow-3xs min-w-0"
                        >
                          <div className="flex justify-between items-start gap-4 mb-1 min-w-0">
                            <p className="font-montserrat font-bold text-xs text-blue-600 truncate flex-1">
                              {comment.author_name}
                            </p>
                            {comment.user_id === user?.id && (
                              <button
                                onClick={() => handleDeleteComment(comment.id)}
                                className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-all shrink-0"
                              >
                                <Trash2 size={13} />
                              </button>
                            )}
                          </div>
                          <p className="text-slate-700 text-sm leading-relaxed font-medium break-words">
                            {comment.content}
                          </p>
                          <div className="mt-2 pt-1.5 border-t border-slate-50 flex items-center">
                            <p className="text-[10px] font-oswald font-semibold text-slate-400 uppercase tracking-wide">
                              {getRelativeTime(comment.created_at)}
                            </p>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-12 border border-dashed border-slate-200 rounded-xl bg-white">
                        <p className="text-slate-400 text-xs font-montserrat font-bold uppercase tracking-wider">
                          No comment lines found
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Expandable Parameter Lower Input Actions Interaction Foot Track */}
              <div className="p-3 bg-slate-50 border-t border-slate-200/60 flex items-center gap-4 shrink-0">
                <button
                  className="flex justify-center items-center p-2.5 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors shrink-0 shadow-3xs"
                  onClick={() => handleLike(selectedPost.id)}
                >
                  <ThumbsUp
                    size={16}
                    className="transition-colors"
                    fill={selectedPost.has_liked ? "#2563eb" : "none"}
                    color={selectedPost.has_liked ? "#2563eb" : "#94a3b8"}
                  />
                </button>
                {activeSelectedPostTab === "comments" && (
                  <div className="bg-transparent flex-1">
                    <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-2 py-1 shadow-3xs focus-within:border-blue-500 transition-all">
                      <input
                        className="flex-1 text-sm text-slate-700 bg-transparent px-2 py-1.5 outline-none placeholder:text-slate-400 font-medium"
                        placeholder="Write community response statement..."
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        onKeyDown={(e) =>
                          e.key === "Enter" && handleCommentSubmit()
                        }
                      />
                      <button
                        onClick={handleCommentSubmit}
                        disabled={uploadingComment || !newComment.trim()}
                        className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-3 py-1.5 flex items-center justify-center transition-all disabled:opacity-40 disabled:bg-slate-300 disabled:cursor-not-allowed shrink-0 font-montserrat font-bold text-[10px] uppercase tracking-wider"
                      >
                        {uploadingComment ? (
                          <Loader size={12} className="animate-spin" />
                        ) : (
                          <Send size={11} />
                        )}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* --- PRIMARY INTERACTIVE DISPATCH LIST WINDOW --- */
            <div className="flex flex-col h-full min-w-0">
              <div className="flex justify-between items-center mb-3 shrink-0 min-w-0">
                <h3 className="font-oswald font-bold text-slate-400 uppercase text-xs tracking-wider">
                  {showArchived
                    ? "Archived Communications Log Index"
                    : `Recent ${activeTab} Activity Log`}
                </h3>
              </div>

              {activeTab === "communication" && (
                <div className="flex flex-col sm:flex-row gap-3 bg-slate-100/80 p-3 rounded-xl border border-slate-200/50 shrink-0 min-w-0 mb-4">
                  <div className="flex-1 relative flex items-center min-w-0">
                    <Search
                      size={15}
                      className="absolute left-3 text-slate-400 pointer-events-none"
                    />
                    <input
                      type="text"
                      placeholder="Filter board entries by text parameter..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full text-xs pl-9 pr-8 py-2 bg-white border border-slate-200/80 rounded-lg outline-none focus:border-blue-500 transition-all font-medium text-slate-700 placeholder:text-slate-400"
                    />
                    {searchQuery && (
                      <button
                        onClick={() => setSearchQuery("")}
                        className="absolute right-3 text-slate-400 hover:text-slate-600 transition-colors"
                      >
                        <X size={13} />
                      </button>
                    )}
                  </div>

                  <button
                    onClick={() => setShowArchived(!showArchived)}
                    className={`flex items-center justify-center gap-1.5 px-4 py-2 border rounded-lg text-xs font-montserrat font-bold uppercase tracking-wider transition-all whitespace-nowrap bg-white shrink-0 shadow-3xs active:scale-98 ${
                      showArchived
                        ? "border-blue-200 text-blue-600 hover:bg-blue-50/50"
                        : "border-slate-200 text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    <Archive
                      size={13}
                      className={
                        showArchived ? "text-blue-600" : "text-slate-400"
                      }
                    />
                    <span>{showArchived ? "Active Feed" : "Archives"}</span>
                  </button>
                </div>
              )}

              {/* SYSTEM DISPATCH SCROLL SECTOR TRACK */}
              <div className="space-y-3 overflow-y-auto p-0.5 flex-1 custom-scrollbar">
                {activeTab === "communication" ? (
                  filteredPosts.length > 0 ? (
                    filteredPosts.map((post) => (
                      <div
                        key={post.id}
                        className="bg-white p-4 rounded-2xl border border-slate-200/70 flex justify-between items-start gap-4 cursor-pointer hover:border-blue-400/50 shadow-2xs hover:shadow-xs transition-all duration-200 group min-w-0 animate-fade-in"
                      >
                        <div
                          className="flex-1 min-w-0"
                          onClick={() => handleOpenPost(post)}
                        >
                          <div className="flex items-center gap-2 mb-1.5 min-w-0">
                            <h4 className="font-montserrat font-bold text-slate-800 tracking-tight group-hover:text-blue-600 transition-colors truncate block flex-1">
                              {post.title}
                            </h4>
                            {!post.admin_seen && !showArchived && (
                              <div className="bg-rose-600 text-white text-[9px] font-oswald font-bold px-1.5 py-0.5 rounded tracking-wider shadow-3xs shrink-0 animate-pulse">
                                NEW
                              </div>
                            )}
                          </div>
                          <p className="text-slate-500 text-xs font-medium line-clamp-2 mb-3.5 pr-2 leading-relaxed">
                            {post.content}
                          </p>

                          <div className="flex items-center gap-4 text-[10px] text-slate-400 font-medium font-oswald tracking-wide">
                            <span className="uppercase text-slate-400">
                              PUBLISHED:{" "}
                              {new Date(post.created_at).toLocaleDateString()}
                            </span>
                            <span className="text-slate-300">•</span>
                            <span className="flex items-center gap-1 text-slate-400 uppercase">
                              <ThumbsUp
                                size={11}
                                fill={post.has_liked ? "#94a3b8" : "none"}
                              />{" "}
                              {post.likes_count} Likes
                            </span>
                            <span className="text-slate-300">•</span>
                            <span className="flex items-center gap-1 text-slate-400 uppercase">
                              <MessageSquare size={11} /> {post.comments_count}{" "}
                              Comments
                            </span>
                          </div>
                        </div>

                        {/* Administrative Post Lifecycle Control Triggers */}
                        <div className="flex items-center gap-1 shrink-0 self-center">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleArchivePost(post.id);
                            }}
                            title={
                              showArchived
                                ? "Restore to public timeline"
                                : "Archive communication entry"
                            }
                            className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all"
                          >
                            <Archive size={14} />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDelete(post.id);
                            }}
                            title="Hard delete entry record"
                            className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-8 bg-white rounded-2xl border-2 border-dashed border-slate-200/70 text-center">
                      <p className="text-slate-400 font-medium text-sm">
                        No board entries map to the current configuration scope.
                      </p>
                    </div>
                  )
                ) : (
                  /* DIRECT DISPATCH ALTERNATE TRACK PLACEMENT */
                  <div className="p-8 bg-white rounded-2xl border-2 border-dashed border-slate-200/70 text-center">
                    <p className="text-slate-400 font-medium text-sm">
                      Direct notification archives are routed through the
                      analytical logging telemetry panel view.
                    </p>
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
