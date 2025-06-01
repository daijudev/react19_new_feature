import { useOptimistic, useActionState } from "react";
import { useFormStatus } from "react-dom";

interface PostFormData {
  id?: number;
  title: string;
  content: string;
  author: string;
  createdAt?: string;
}

interface ActionState {
  success: boolean;
  error?: string;
  data?: PostFormData;
  message?: string;
}

interface NewPostFormProps {
  onNewPost: (post: PostFormData) => void;
}

// フォーム送信中の状態を表示するコンポーネント
function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:opacity-50"
    >
      {pending ? "送信中..." : "投稿する"}
    </button>
  );
}

// 新しい投稿を作成するAction
async function createPost(post: PostFormData): Promise<PostFormData> {
  // 投稿処理を擬似的に遅延させる
  await new Promise((resolve) => setTimeout(resolve, 3000));

  const response = await fetch("http://localhost:3001/posts", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(post),
  });

  if (!response.ok) {
    throw new Error("投稿の作成に失敗しました");
  }

  return response.json();
}

export default function NewPostForm({ onNewPost }: NewPostFormProps) {
  const [optimisticPosts, addOptimisticPost] = useOptimistic<PostFormData[]>(
    []
  );
  const [actionState, formAction] = useActionState<ActionState, FormData>(
    async (_, formData) => {
      const newPost: PostFormData = {
        title: formData.get("title") as string,
        content: formData.get("content") as string,
        author: formData.get("author") as string,
      };

      // 楽観的更新を追加
      addOptimisticPost((prev) => [...prev, newPost]);

      try {
        const result = await createPost(newPost);
        // 親コンポーネントに新しい投稿を通知
        onNewPost(result);
        return {
          success: true,
          data: result,
          message: "投稿が完了しました",
        };
      } catch (error) {
        return {
          success: false,
          error:
            error instanceof Error ? error.message : "投稿の作成に失敗しました",
        };
      }
    },
    { success: false }
  );

  return (
    <div className="space-y-6">
      <form action={formAction} className="space-y-4">
        <div>
          <label htmlFor="title">タイトル</label>
          <input
            type="text"
            id="title"
            name="title"
            required
            className="form-input"
          />
        </div>

        <div>
          <label htmlFor="content">内容</label>
          <textarea
            id="content"
            name="content"
            required
            rows={4}
            className="form-textarea"
          />
        </div>

        <div>
          <label htmlFor="author">投稿者</label>
          <input
            type="text"
            id="author"
            name="author"
            required
            className="form-input"
          />
        </div>

        <SubmitButton />
      </form>

      {/* 成功メッセージの表示 */}
      {actionState.success && actionState.message && (
        <div>{actionState.message}</div>
      )}

      {/* エラーメッセージの表示 */}
      {actionState.error && <div>{actionState.error}</div>}

      {/* 楽観的更新のプレビュー */}
      {optimisticPosts.length > 0 && (
        <>
          <h3>投稿プレビュー</h3>
          <div className="post">
            <div>
              {optimisticPosts.map((post, index) => (
                <div key={index}>
                  <h2>{post.title}</h2>
                  <p>{post.content}</p>
                  <p>投稿者: {post.author}</p>
                  <div className="comments">
                    <h3>コメント</h3>
                  </div>
                  <div>投稿処理中...</div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
