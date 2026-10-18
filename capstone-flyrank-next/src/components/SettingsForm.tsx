'use client'

import { useId, useState } from 'react'
import { updateSettings, deleteAllProposals } from '@/app/settings/actions'
import { signout } from '@/app/auth/actions'
import {
  Mail,
  LogOut,
  Sliders,
  AlertTriangle,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Trash2,
} from 'lucide-react'

type SettingsFormProps = {
  email: string
  initialTone: string
  initialLength: string
}

export default function SettingsForm({
  email,
  initialTone,
  initialLength,
}: SettingsFormProps) {
  // Preferences state
  const fieldId = useId()
  const emailFieldId = `${fieldId}-account-email`
  const toneFieldId = `${fieldId}-default-tone`
  const lengthFieldId = `${fieldId}-default-length`
  const confirmDeleteId = `${fieldId}-confirm-delete`
  const [tone, setTone] = useState(initialTone || 'professional')
  const [length, setLength] = useState(initialLength || 'medium')
  const [isSaving, setIsSaving] = useState(false)
  const [saveMessage, setSaveMessage] = useState<{
    type: 'success' | 'error'
    text: string
  } | null>(null)

  // Sign out state
  const [isSigningOut, setIsSigningOut] = useState(false)

  // Danger zone state
  const [confirmInput, setConfirmInput] = useState('')
  const [isDeleting, setIsDeleting] = useState(false)
  const [deleteMessage, setDeleteMessage] = useState<{
    type: 'success' | 'error'
    text: string
  } | null>(null)

  const handleSavePreferences = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)
    setSaveMessage(null)

    const formData = new FormData()
    formData.append('default_tone', tone)
    formData.append('default_length', length)

    try {
      const res = await updateSettings(formData)
      if (res?.error) {
        setSaveMessage({ type: 'error', text: res.error })
      } else {
        setSaveMessage({
          type: 'success',
          text: 'Proposal defaults saved successfully.',
        })
        setTimeout(() => setSaveMessage(null), 4000)
      }
    } catch {
      setSaveMessage({
        type: 'error',
        text: 'Failed to update settings. Please try again.',
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleSignOut = async () => {
    setIsSigningOut(true)
    try {
      await signout()
    } catch {
      setIsSigningOut(false)
    }
  }

  const handleDeleteAllProposals = async () => {
    if (confirmInput.trim() !== 'DELETE') return

    setIsDeleting(true)
    setDeleteMessage(null)

    try {
      const res = await deleteAllProposals()
      if (res?.error) {
        setDeleteMessage({ type: 'error', text: res.error })
      } else {
        const count = res.count ?? 0
        setDeleteMessage({
          type: 'success',
          text:
            count === 0
              ? 'No proposals to delete. All clean!'
              : `Successfully deleted ${count} proposal${count === 1 ? '' : 's'}.`,
        })
        setConfirmInput('')
      }
    } catch {
      setDeleteMessage({
        type: 'error',
        text: 'Failed to delete proposals. Please try again.',
      })
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <div className="space-y-8">
      {/* Account Section */}
      <section className="bg-white rounded-[var(--radius)] border border-gray-200 p-4 sm:p-6 shadow-xs">
        <div className="flex items-center gap-2 mb-4">
          <Mail className="w-5 h-5 text-[var(--primary)]" />
          <h2 className="text-xl font-semibold text-[var(--foreground)]">
            Account
          </h2>
        </div>

        <div className="space-y-4 max-w-xl">
          <div>
            <label htmlFor={emailFieldId} className="block text-sm font-medium text-[var(--foreground)] mb-1">
              Account Email
            </label>
            <div className="relative">
              <input
                id={emailFieldId}
                type="email"
                value={email}
                readOnly
                aria-label="Account Email"
                className="w-full p-2.5 bg-gray-50 text-gray-700 border border-gray-300 rounded-[var(--radius)] cursor-not-allowed select-all focus:outline-hidden"
              />
              <span className="absolute right-3 top-2.5 text-xs font-medium text-gray-700 bg-gray-200 px-2 py-0.5 rounded">
                Read only
              </span>
            </div>
            <p className="text-xs text-[var(--muted)] mt-1.5">
              Email is managed by your authentication account.
            </p>
          </div>

          <div className="pt-2">
            <button
              type="button"
              onClick={handleSignOut}
              disabled={isSigningOut}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-[var(--radius)] transition-colors disabled:opacity-50"
            >
              {isSigningOut ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <LogOut className="w-4 h-4" />
              )}
              {isSigningOut ? 'Signing out...' : 'Sign out'}
            </button>
          </div>
        </div>
      </section>

      {/* Proposal Defaults Section */}
      <section className="bg-white rounded-[var(--radius)] border border-gray-200 p-4 sm:p-6 shadow-xs">
        <div className="flex items-center gap-2 mb-2">
          <Sliders className="w-5 h-5 text-[var(--primary)]" />
          <h2 className="text-xl font-semibold text-[var(--foreground)]">
            Proposal Defaults
          </h2>
        </div>
        <p className="text-sm text-[var(--muted)] mb-6">
          Set the default generation tone and length for your proposals. These
          values will be pre-selected when generating new proposals.
        </p>

        {saveMessage && (
          <div
            className={`mb-6 p-3 rounded-[var(--radius)] flex items-start gap-2.5 text-sm ${
              saveMessage.type === 'success'
                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                : 'bg-red-50 text-red-800 border border-red-200'
            }`}
          >
            {saveMessage.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
            )}
            <span>{saveMessage.text}</span>
          </div>
        )}

        <form onSubmit={handleSavePreferences} className="space-y-5 max-w-xl">
          <div>
            <label
              htmlFor={toneFieldId}
              className="block text-sm font-medium text-[var(--foreground)] mb-1"
            >
              Default Tone
            </label>
            <select
              id={toneFieldId}
              value={tone}
              onChange={(e) => setTone(e.target.value)}
              className="w-full p-2.5 border border-gray-300 rounded-[var(--radius)] bg-white text-[var(--foreground)] focus:ring-2 focus:ring-[var(--primary)] focus:outline-hidden"
            >
              <option value="professional">
                Professional (Balanced, polished, formal)
              </option>
              <option value="friendly">
                Friendly (Warm, conversational, approachable)
              </option>
              <option value="confident">
                Confident (Direct, authoritative, bold)
              </option>
              <option value="concise">
                Concise (Brief, to the point, efficient)
              </option>
            </select>
          </div>

          <div>
            <label
              htmlFor={lengthFieldId}
              className="block text-sm font-medium text-[var(--foreground)] mb-1"
            >
              Default Length
            </label>
            <select
              id={lengthFieldId}
              value={length}
              onChange={(e) => setLength(e.target.value)}
              className="w-full p-2.5 border border-gray-300 rounded-[var(--radius)] bg-white text-[var(--foreground)] focus:ring-2 focus:ring-[var(--primary)] focus:outline-hidden"
            >
              <option value="short">Short (100–150 words)</option>
              <option value="medium">Medium (200–300 words)</option>
              <option value="long">Long (400–500 words)</option>
            </select>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={isSaving}
              className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-white bg-[var(--primary)] hover:opacity-95 rounded-[var(--radius)] transition-opacity disabled:opacity-50"
            >
              {isSaving && <Loader2 className="w-4 h-4 animate-spin" />}
              {isSaving ? 'Saving preferences...' : 'Save preferences'}
            </button>
          </div>
        </form>
      </section>

      {/* Danger Zone Section */}
      <section className="bg-red-50/40 rounded-[var(--radius)] border border-red-200 p-4 sm:p-6 shadow-xs">
        <div className="flex items-center gap-2 mb-2">
          <AlertTriangle className="w-5 h-5 text-red-600" />
          <h2 className="text-xl font-semibold text-red-900">Danger Zone</h2>
        </div>
        <p className="text-sm text-red-700 mb-6">
          Irreversible actions related to your proposal data. Actions here
          permanently delete records and cannot be undone.
        </p>

        {deleteMessage && (
          <div
            className={`mb-6 p-3 rounded-[var(--radius)] flex items-start gap-2.5 text-sm ${
              deleteMessage.type === 'success'
                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                : 'bg-red-100 text-red-900 border border-red-300'
            }`}
          >
            {deleteMessage.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-5 h-5 text-red-700 shrink-0 mt-0.5" />
            )}
            <span>{deleteMessage.text}</span>
          </div>
        )}

        <div className="border-t border-red-200 pt-5 space-y-4 max-w-xl">
          <div>
            <h3 className="text-base font-medium text-red-950">
              Delete all my proposals
            </h3>
            <p className="text-sm text-red-700 mt-1">
              Permanently delete all proposal drafts, generated texts, and
              analyses associated with your account.
            </p>
          </div>

          <div className="space-y-2">
            <label
              htmlFor={confirmDeleteId}
              className="block text-xs font-medium text-red-900 uppercase tracking-wider"
            >
              Type <span className="font-mono font-bold">DELETE</span> to confirm
            </label>
            <input
              id={confirmDeleteId}
              type="text"
              value={confirmInput}
              onChange={(e) => setConfirmInput(e.target.value)}
              placeholder="Type DELETE"
              disabled={isDeleting}
              className="w-full p-2.5 bg-white border border-red-300 rounded-[var(--radius)] text-red-900 placeholder-red-700 focus:outline-hidden focus:ring-2 focus:ring-red-500 font-mono text-sm disabled:opacity-50"
            />
          </div>

          <button
            type="button"
            onClick={handleDeleteAllProposals}
            disabled={confirmInput !== 'DELETE' || isDeleting}
            className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-[var(--radius)] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {isDeleting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Trash2 className="w-4 h-4" />
            )}
            {isDeleting ? 'Deleting proposals...' : 'Delete all my proposals'}
          </button>
        </div>
      </section>
    </div>
  )
}
