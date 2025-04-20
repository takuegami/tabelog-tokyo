'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase'; // Supabase クライアントをインポート
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import Image from 'next/image';
import { X, Loader2 } from 'lucide-react'; // アイコンをインポート
import { v4 as uuidv4 } from 'uuid'; // UUID生成ライブラリ

interface MultiImageUploaderProps {
  value?: string[]; // react-hook-form から渡される URL 配列
  onChange: (urls: string[]) => void; // react-hook-form に変更を通知する関数
  bucketName?: string; // アップロード先のバケット名 (デフォルト: 'shop-images')
}

interface UploadingFile {
  id: string; // 一意なID (プレビュー用)
  file: File;
  previewUrl: string;
  isLoading: boolean;
  error?: string;
}

export function MultiImageUploader({
  value = [], // デフォルトは空配列
  onChange,
  bucketName = 'shop-images', // デフォルトのバケット名
}: MultiImageUploaderProps) {
  const [uploadedUrls, setUploadedUrls] = useState<string[]>(value);
  const [uploadingFiles, setUploadingFiles] = useState<UploadingFile[]>([]);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // props.value が変更されたら内部状態も更新
  useEffect(() => {
    // 外部からの value と内部の uploadedUrls が異なる場合のみ更新
    // これにより、内部での onChange によるループを防ぐ
    // JSON.stringify で比較するのは、配列の参照ではなく内容を比較するため
    if (JSON.stringify(value) !== JSON.stringify(uploadedUrls)) {
        setUploadedUrls(value);
    }
  }, [value, uploadedUrls]); // uploadedUrls も依存配列に追加

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const newUploadingFiles: UploadingFile[] = Array.from(files).map((file) => ({
      id: uuidv4(), // 各ファイルに一意なIDを付与
      file,
      previewUrl: URL.createObjectURL(file),
      isLoading: true, // 初期状態はローディング中
    }));

    setUploadingFiles((prev) => [...prev, ...newUploadingFiles]);

    // 各ファイルを非同期でアップロード
    const uploadPromises = newUploadingFiles.map(async (uploadingFile) => {
      try {
        const fileExt = uploadingFile.file.name.split('.').pop();
        const fileName = `${uuidv4()}.${fileExt}`; // 一意なファイル名
        const filePath = `${fileName}`; // バケット内のパス

        const { error } = await supabase.storage
          .from(bucketName)
          .upload(filePath, uploadingFile.file);

        if (error) {
          throw error;
        }

        // 公開URLを取得
        const { data: publicUrlData } = supabase.storage
          .from(bucketName)
          .getPublicUrl(filePath);

        if (!publicUrlData?.publicUrl) {
            throw new Error('Failed to get public URL.');
        }

        // アップロード成功 - isLoadingをfalseにする（表示更新のため）
        // この時点ではまだ uploadingFiles から削除しない
        setUploadingFiles((prev) =>
          prev.map((f) =>
            f.id === uploadingFile.id ? { ...f, isLoading: false } : f
          )
        );
        // 成功したファイルのIDとURLを返す
        return { id: uploadingFile.id, url: publicUrlData.publicUrl };

      } catch (error) {
        console.error('Upload error:', error);
        // アップロード失敗
        setUploadingFiles((prev) =>
          prev.map((f) =>
            f.id === uploadingFile.id
              ? { ...f, isLoading: false, error: error instanceof Error ? error.message : 'Upload failed' }
              : f
          )
        );
        return null; // 失敗した場合は null を返す
      }
    });

    // 全てのアップロードが完了するのを待つ
    const results = await Promise.all(uploadPromises);
    // 成功したアップロードのみフィルタリング（IDとURLを含むオブジェクト）
    const successfulUploads = results.filter((result): result is { id: string; url: string } => result !== null);
    const successfulUrls = successfulUploads.map(r => r.url);
    const successfulIds = successfulUploads.map(r => r.id);

    // 成功したURLを既存のURLリストに追加して onChange を呼び出す
    if (successfulUrls.length > 0) {
      const newUrls = [...uploadedUrls, ...successfulUrls];
      // setUploadedUrls(newUrls); // <- この行を削除。useEffectで処理される
      onChange(newUrls); // react-hook-form に通知
    }

    // 成功したファイルを uploadingFiles から削除
    // 少し遅延させて削除することで、完了表示が一瞬見えるようにする（任意）
    setTimeout(() => {
        setUploadingFiles((prev) => prev.filter((f) => !successfulIds.includes(f.id)));
        // プレビュー用URLのメモリ解放
        successfulUploads.forEach(upload => {
            const fileToRemove = uploadingFiles.find(f => f.id === upload.id);
            if (fileToRemove) {
                URL.revokeObjectURL(fileToRemove.previewUrl);
            }
        });
    }, 500); // 0.5秒後に削除

     // input の値をリセットして同じファイルを再度選択できるようにする
     if (fileInputRef.current) {
        fileInputRef.current.value = '';
     }
  };

  const handleRemoveUploadingFile = (idToRemove: string) => {
    const fileToRemove = uploadingFiles.find(f => f.id === idToRemove);
    if (fileToRemove) {
        URL.revokeObjectURL(fileToRemove.previewUrl); // メモリリーク防止
    }
    setUploadingFiles((prev) => prev.filter((f) => f.id !== idToRemove));
  };

  const handleRemoveUploadedUrl = (urlToRemove: string) => {
    const newUrls = uploadedUrls.filter((url) => url !== urlToRemove);
    // setUploadedUrls(newUrls); // <- この行を削除。onChange経由でuseEffectで処理される
    onChange(newUrls); // react-hook-form に通知
    // TODO: 必要であれば Supabase Storage からもファイルを削除する処理を追加
    // const fileName = urlToRemove.split('/').pop();
    // if (fileName) {
    //   supabase.storage.from(bucketName).remove([fileName]);
    // }
  };

  // コンポーネントのアンマウント時にプレビューURLを解放
  useEffect(() => {
    return () => {
      uploadingFiles.forEach(f => URL.revokeObjectURL(f.previewUrl));
    };
  }, [uploadingFiles]);

  return (
    <div className="space-y-4">
      {/* 既存のアップロード済み画像プレビュー */}
      {uploadedUrls.length > 0 && (
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
          {uploadedUrls.map((url) => (
            <div key={url} className="relative group aspect-square">
              <Image
                src={url}
                alt="アップロード済み画像"
                fill
                sizes="(max-width: 640px) 33vw, (max-width: 768px) 25vw, 20vw"
                className="object-cover rounded-md border"
                onError={() => {
                  // 画像読み込みエラー時の処理（例: 代替画像表示やURL削除）
                  console.error(`Failed to load image: ${url}`);
                  // handleRemoveUploadedUrl(url); // エラー画像をリストから削除する場合
                }}
              />
              <Button
                variant="destructive"
                size="icon"
                className="absolute top-1 right-1 h-6 w-6 rounded-full opacity-0 group-hover:opacity-100 transition-opacity z-10"
                onClick={() => handleRemoveUploadedUrl(url)}
                type="button" // form の submit をトリガーしないように
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      )}

      {/* アップロード中のファイルプレビュー */}
      {uploadingFiles.length > 0 && (
         <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
          {uploadingFiles.map((uploadingFile) => (
            <div key={uploadingFile.id} className="relative group aspect-square">
              <Image
                src={uploadingFile.previewUrl}
                alt={`アップロード中: ${uploadingFile.file.name}`}
                fill
                sizes="(max-width: 640px) 33vw, (max-width: 768px) 25vw, 20vw"
                className={`object-cover rounded-md border ${uploadingFile.isLoading || uploadingFile.error ? 'opacity-50' : ''}`}
              />
              {/* ローディング・エラー表示 */}
              <div className="absolute inset-0 flex items-center justify-center bg-black/30 rounded-md pointer-events-none">
                {uploadingFile.isLoading ? (
                  <Loader2 className="h-6 w-6 animate-spin text-white" />
                ) : uploadingFile.error ? (
                   <span className="text-xs text-destructive-foreground bg-destructive p-1 rounded text-center">Error</span>
                ) : (
                  // アップロード完了直後は何も表示しない（setTimeoutで消えるため）
                  null
                )}
              </div>
               {/* エラー時 or アップロード中の削除ボタン (ホバーで表示) */}
               {(uploadingFile.error || uploadingFile.isLoading) && (
                 <Button
                    variant={uploadingFile.error ? "destructive" : "secondary"}
                    size="icon"
                    className="absolute top-1 right-1 h-6 w-6 rounded-full z-10 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => handleRemoveUploadingFile(uploadingFile.id)}
                    type="button"
                  >
                    <X className="h-4 w-4" />
                  </Button>
               )}
            </div>
          ))}
        </div>
      )}


      {/* ファイル選択ボタン */}
      <div>
        <Input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*"
          onChange={handleFileChange}
          className="block w-full text-sm text-slate-500
            file:mr-4 file:py-2 file:px-4
            file:rounded-full file:border-0
            file:text-sm file:font-semibold
            file:bg-violet-50 file:text-violet-700
            hover:file:bg-violet-100"
          // disabled={uploadingFiles.some(f => f.isLoading)} // アップロード中は無効化する場合
        />
         <p className="mt-1 text-xs text-muted-foreground">
            複数の画像ファイルを選択できます。
          </p>
      </div>
    </div>
  );
}