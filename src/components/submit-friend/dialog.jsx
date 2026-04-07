'use client'

/**
 * [INPUT]: 依赖 @/components/ui/dialog 的 Dialog 组件，lucide-react 的图标
 * [OUTPUT]: 对外提供 SubmitFriendDialog 组件，用于提交友链申请
 * [POS]: components/submit-friend/ 的友链提交弹窗，被 friends/page.js 使用
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { useState } from 'react'
import { PlusIcon } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog'

export function SubmitFriendDialog() {
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({ name: '', url: '', avatar: '', github: '', signature: '' })

  const handleSubmit = async (e) => {
    e.preventDefault()
    // TODO: Integrate with actual friend submission endpoint
    console.info('Friend submission:', form)
    setOpen(false)
    setForm({ name: '', url: '', avatar: '', github: '', signature: '' })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="default" size="sm" className="gap-2">
          <PlusIcon size={14} />
          <span>Add Friend</span>
        </Button>
      </DialogTrigger>
      <DialogContent>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Submit a Friend</DialogTitle>
            <DialogDescription>
              Know someone who writes code and tinkers with fun things? Drop their link here.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-2 py-4">
            {[
              { id: 'name', label: 'Name', placeholder: 'Your friend\'s name', required: true },
              { id: 'url', label: 'Website', placeholder: 'https://example.com', required: true },
              { id: 'avatar', label: 'Avatar URL', placeholder: 'https://example.com/avatar.jpg' },
              { id: 'github', label: 'GitHub Username', placeholder: 'username' },
              { id: 'signature', label: 'Signature', placeholder: 'A short signature or motto' }
            ].map(({ id, label, placeholder, required }) => (
              <div key={id} className="grid gap-2">
                <label htmlFor={id} className="text-sm font-medium">
                  {label} {required && <span className="text-red-500">*</span>}
                </label>
                <input
                  id={id}
                  type={id === 'url' || id === 'avatar' ? 'url' : 'text'}
                  placeholder={placeholder}
                  required={required}
                  value={form[id]}
                  onChange={(e) => setForm((f) => ({ ...f, [id]: e.target.value }))}
                  className="flex h-9 w-full rounded-md border border-gray-200 bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-gray-400 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-gray-950"
                />
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button type="submit" size="sm">Submit</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
