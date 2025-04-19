'use client'; // クライアントコンポーネントとして扱う

import * as React from 'react';
import Image from 'next/image';
import Link from 'next/link';

export function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 shadow-sm">
      <div className="container flex h-14 max-w-screen-2xl items-center justify-center">
        <div className="flex">
          <Link href="/" className="mr-6 flex items-center space-x-2">
            <Image
              src="/images/logo.svg"
              alt="Table Rec Logo"
              width={150}
              height={36}
              priority
            />
          </Link>
        </div>
      </div>
    </header>
  );
}
