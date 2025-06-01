import { Suspense, useState } from "react";
import "./App.css";
import NewPostForm from "./components/NewPostForm";

interface Post {
  id: number;
  title: string;
  content: string;
  author: string;
}

interface Comment {
  id: number;
  postId: number;
  text: string;
  author: string;
}

interface PostFormData {
  title: string;
  content: string;
  author: string;
}

// Promiseリソースを作成する関数
const createResource = <T,>(promise: Promise<T>) => {
  let status: "pending" | "success" | "error" = "pending";
  let result: T;
  let error: Error;

  const suspender = promise.then(
    (data) => {
      status = "success";
      result = data;
    },
    (e) => {
      status = "error";
      error = e;
    }
  );

  return {
    read() {
      if (status === "pending") {
        throw suspender;
      } else if (status === "error") {
        throw error;
      } else if (status === "success") {
        return result;
      }
    },
  };
};

// データ取得用のリソース
const postsResource = createResource<Post[]>(
  fetch("http://localhost:3001/posts").then((res) => res.json())
);

const commentsResource = createResource<Comment[]>(
  fetch("http://localhost:3001/comments").then((res) => res.json())
);

// 投稿リストコンポーネント
const PostList = ({ newPosts }: { newPosts: Post[] }) => {
  const posts = postsResource.read();
  const comments = commentsResource.read();

  // 新しい投稿と既存の投稿を結合し、新しい投稿を先頭に配置
  const allPosts = [...newPosts, ...(posts || [])];

  return (
    <div className="posts">
      {allPosts.map((post: Post) => (
        <div key={post.id} className="post">
          <h2>{post.title}</h2>
          <p>{post.content}</p>
          <p>投稿者: {post.author}</p>
          <div className="comments">
            <h3>コメント</h3>
            {comments
              ?.filter((comment: Comment) => comment.postId === post.id)
              .map((comment: Comment) => (
                <div key={comment.id} className="comment">
                  <p>{comment.text}</p>
                  <p>投稿者: {comment.author}</p>
                </div>
              ))}
          </div>
        </div>
      ))}
    </div>
  );
};

// ローディングフォールバックコンポーネント
const LoadingFallback = () => (
  <div className="loading">
    <p>読み込み中...</p>
  </div>
);

function App() {
  const [newPosts, setNewPosts] = useState<Post[]>([]);

  const handleNewPost = (post: PostFormData) => {
    setNewPosts((prev) => [post as Post, ...prev]);
  };

  return (
    <div className="App">
      <h1>ブログ投稿一覧</h1>
      <NewPostForm onNewPost={handleNewPost} />
      <Suspense fallback={<LoadingFallback />}>
        <PostList newPosts={newPosts} />
      </Suspense>
    </div>
  );
}

export default App;
