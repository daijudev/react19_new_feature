import { Suspense, useState, use } from "react";
import "./App.css";
import NewPostForm from "./components/NewPostForm";

interface Post {
  id: number;
  title: string;
  content: string;
  author: string;
  createdAt?: string;
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

// ローカルストレージのキー
const STORAGE_KEYS = {
  POSTS: 'blog_posts',
  COMMENTS: 'blog_comments'
};

// 初期データ
const initialPosts: Post[] = [
  {
    id: 1,
    title: "Reactの新しい機能について",
    content: "React 19で導入される新機能について解説します。",
    author: "山田太郎"
  },
  {
    id: 2,
    title: "TypeScriptの型システム",
    content: "TypeScriptの型システムの基礎から応用まで解説します。",
    author: "鈴木花子"
  }
];

const initialComments: Comment[] = [
  {
    id: 1,
    postId: 1,
    text: "とても参考になりました！",
    author: "佐藤次郎"
  },
  {
    id: 2,
    postId: 1,
    text: "詳しい解説ありがとうございます。",
    author: "田中三郎"
  }
];

// データ取得用のPromise
const fetchData = <T,>(key: string, defaultValue: T): Promise<T> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const data = localStorage.getItem(key);
      resolve(data ? JSON.parse(data) : defaultValue);
    }, 1000); // 1秒の遅延を追加
  });
};

// データリソース
const postsPromise = fetchData(STORAGE_KEYS.POSTS, initialPosts);
const commentsPromise = fetchData(STORAGE_KEYS.COMMENTS, initialComments);

// 投稿リストコンポーネント
const PostList = ({ newPosts }: { newPosts: Post[] }) => {
  // useフックを使用してデータを取得
  const posts = use(postsPromise);
  const comments = use(commentsPromise);

  // 新しい投稿と既存の投稿を結合
  const allPosts = [...newPosts, ...posts];

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
              .filter((comment: Comment) => comment.postId === post.id)
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
    <h1>ローディング中...</h1>
  </div>
);

function App() {
  const [newPosts, setNewPosts] = useState<Post[]>([]);

  const handleNewPost = (postData: PostFormData) => {
    const newPost: Post = {
      id: Date.now(),
      ...postData,
      createdAt: new Date().toISOString()
    };
    
    setNewPosts(prev => [newPost, ...prev]);
    
    // ローカルストレージに保存
    const currentPosts = JSON.parse(localStorage.getItem(STORAGE_KEYS.POSTS) || JSON.stringify(initialPosts));
    localStorage.setItem(STORAGE_KEYS.POSTS, JSON.stringify([newPost, ...currentPosts]));
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
