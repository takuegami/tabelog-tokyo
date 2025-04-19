'use client'; // useThemeフックを使用するためクライアントコンポーネントに

import * as React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useTheme } from 'next-themes';
import { Moon, Sun } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export function Header() {
  const { setTheme } = useTheme();

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 shadow-sm">
      <div className="container flex h-14 max-w-screen-2xl items-center justify-center"> {/* justify-between を justify-center に変更 */}
        <div className="flex"> {/* mr-4 を削除 */}
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
        {/* 右側の要素 (ダークモード切り替えボタンを削除) */}
        {/* <div className="flex flex-1 items-center justify-end space-x-2"> */}
          {/* ダークモード切り替えボタン */}
          {/*
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                <span className="sr-only">Toggle theme</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setTheme('light')}>
                Light
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTheme('dark')}>
                Dark
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTheme('system')}>
                System
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
           */}
        {/* </div> */}
      </div>
    </header>
  );
}
