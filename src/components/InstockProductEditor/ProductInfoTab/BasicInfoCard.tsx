'use client';

import slugify from 'slugify';
import { type UseFormReturn } from 'react-hook-form';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { Bold, Italic, Strikethrough, List, ListOrdered } from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FormField, FormItem, FormLabel, FormControl, FormMessage, FormDescription } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

import type { ProductFormValues } from '@/pages/manager/product-editor/schema';

// =====================================================================
// COMPONENT EDITOR (Xây dựng bằng TipTap + Shadcn UI + Lucide Icons)
// =====================================================================
export const RichTextEditor = ({ value, onChange }: { value: string; onChange: (val: string) => void }) => {
  const editor = useEditor({
    extensions: [StarterKit],
    content: value || '',
    editorProps: {
      attributes: {
        // Cấu hình CSS thủ công để chống lại reset CSS của Tailwind
        class: 'focus:outline-none min-h-[150px] p-3 text-sm [&_ul]:list-disc [&_ul]:ml-5 [&_ul]:my-2 [&_ol]:list-decimal [&_ol]:ml-5 [&_ol]:my-2 [&_h2]:text-lg [&_h2]:font-bold [&_h2]:mt-4 [&_h2]:mb-2 [&_p]:my-1 [&_blockquote]:border-l-4 [&_blockquote]:border-slate-300 [&_blockquote]:pl-4 [&_blockquote]:italic [&_blockquote]:text-slate-500',
      },
    },
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
  });

  if (!editor) return null;

  return (
    <div className="border border-input rounded-md bg-white overflow-hidden focus-within:ring-1 focus-within:ring-ring transition-shadow">
      {/* THANH TOOLBAR */}
      <div className="flex flex-wrap items-center gap-1 border-b bg-slate-50/50 p-1">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={`h-8 w-8 p-0 ${editor.isActive('bold') ? 'bg-slate-200 text-slate-900' : 'text-slate-600'}`}
        >
          <Bold className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={`h-8 w-8 p-0 ${editor.isActive('italic') ? 'bg-slate-200 text-slate-900' : 'text-slate-600'}`}
        >
          <Italic className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleStrike().run()}
          className={`h-8 w-8 p-0 ${editor.isActive('strike') ? 'bg-slate-200 text-slate-900' : 'text-slate-600'}`}
        >
          <Strikethrough className="h-4 w-4" />
        </Button>
        
        <div className="w-[1px] h-4 bg-slate-300 mx-1" /> {/* Divider */}

        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          className={`h-8 px-2.5 font-bold ${editor.isActive('heading', { level: 2 }) ? 'bg-slate-200 text-slate-900' : 'text-slate-600'}`}
        >
          H2
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={`h-8 w-8 p-0 ${editor.isActive('bulletList') ? 'bg-slate-200 text-slate-900' : 'text-slate-600'}`}
        >
          <List className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={`h-8 w-8 p-0 ${editor.isActive('orderedList') ? 'bg-slate-200 text-slate-900' : 'text-slate-600'}`}
        >
          <ListOrdered className="h-4 w-4" />
        </Button>
      </div>

      {/* KHU VỰC SOẠN THẢO */}
      <EditorContent editor={editor} className="cursor-text" onClick={() => editor.commands.focus()} />
    </div>
  );
};

interface BasicInfoCardProps {
  form: UseFormReturn<ProductFormValues>;
  isCreateMode: boolean;
}

export function BasicInfoCard({ form, isCreateMode }: BasicInfoCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Basic Information</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Product Name *</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="Awesome Product" 
                    {...field} 
                    onChange={(e) => {
                      field.onChange(e);
                      if (isCreateMode) {
                        const autoSlug = slugify(e.target.value, { lower: true, strict: true, locale: 'vi', trim: true });
                        form.setValue('slug', autoSlug, { shouldValidate: false, shouldDirty: true });
                      }
                    }}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="slug"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Slug *</FormLabel>
                <FormControl><Input placeholder="my-product" {...field} /></FormControl>
                <FormDescription>Auto-generated from name.</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      </CardContent>
    </Card>
  );
}