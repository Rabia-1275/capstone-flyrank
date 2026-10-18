'use client'

import { useId, useState } from 'react'
import { saveProfile } from '@/app/profile/actions'

type Profile = {
  full_name: string | null
  headline: string | null
  skills: string[] | null
  portfolio_links: string[] | null
  tone: string | null
}

export default function ProfileForm({ initialData }: { initialData: Profile | null }) {
  const fieldId = useId()
  const fullNameId = `${fieldId}-full-name`
  const headlineId = `${fieldId}-headline`
  const toneId = `${fieldId}-tone`
  const skillInputId = `${fieldId}-skill-input`
  const linkInputId = `${fieldId}-link-input`
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ text: string, type: 'success' | 'error' } | null>(null)

  const [skills, setSkills] = useState<string[]>(initialData?.skills || [])
  const [skillInput, setSkillInput] = useState('')
  
  const [links, setLinks] = useState<string[]>(initialData?.portfolio_links || [])
  const [linkInput, setLinkInput] = useState('')

  const handleAddSkill = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      const val = skillInput.trim()
      if (val && !skills.includes(val) && skills.length < 20) {
        setSkills([...skills, val])
        setSkillInput('')
      }
    }
  }

  const handleRemoveSkill = (skill: string) => {
    setSkills(skills.filter(s => s !== skill))
  }

  const handleAddLink = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      const val = linkInput.trim()
      if (val && !links.includes(val) && links.length < 10) {
        if (/^https?:\/\//.test(val)) {
          setLinks([...links, val])
          setLinkInput('')
        } else {
          setMessage({ text: 'Must be a valid http(s) URL', type: 'error' })
        }
      }
    }
  }

  const handleRemoveLink = (link: string) => {
    setLinks(links.filter(l => l !== link))
  }

  const handleSubmit = async (formData: FormData) => {
    setLoading(true)
    setMessage(null)


    const result = await saveProfile(formData)
    
    if (result.error) {
      setMessage({ text: result.error, type: 'error' })
    } else {
      setMessage({ text: 'Profile saved successfully!', type: 'success' })
    }
    setLoading(false)
  }

  return (
    <div className="p-6 border border-gray-200 rounded-[var(--radius)] bg-[var(--background)] shadow-sm">
      <h2 className="text-xl font-bold mb-4 text-[var(--foreground)]">Basic Information</h2>
      
      {message && (
        <div className={`mb-4 p-3 rounded-[var(--radius)] text-sm ${message.type === 'error' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
          {message.text}
        </div>
      )}
      
      <form action={handleSubmit} className="flex flex-col gap-4">
        <input type="hidden" name="skills" value={JSON.stringify(skills)} />
        <input type="hidden" name="portfolio_links" value={JSON.stringify(links)} />
        <div>
          <label htmlFor={fullNameId} className="block text-sm font-medium mb-1 text-[var(--foreground)]">Full Name *</label>
          <input 
            id={fullNameId}
            name="full_name" 
            defaultValue={initialData?.full_name || ''} 
            required 
            className="w-full p-2 border border-gray-300 rounded-[var(--radius)]"
          />
        </div>
        
        <div>
          <label htmlFor={headlineId} className="block text-sm font-medium mb-1 text-[var(--foreground)]">Headline</label>
          <input 
            id={headlineId}
            name="headline" 
            defaultValue={initialData?.headline || ''} 
            placeholder="e.g. Frontend developer & AI integrator"
            className="w-full p-2 border border-gray-300 rounded-[var(--radius)]"
          />
        </div>
        
        <div>
          <label htmlFor={toneId} className="block text-sm font-medium mb-1 text-[var(--foreground)]">Tone</label>
          <select id={toneId} name="tone" defaultValue={initialData?.tone || 'professional'} className="w-full p-2 border border-gray-300 rounded-[var(--radius)]">
            <option value="professional">Professional</option>
            <option value="friendly">Friendly</option>
            <option value="confident">Confident</option>
            <option value="concise">Concise</option>
          </select>
        </div>

        <div>
          <label htmlFor={skillInputId} className="block text-sm font-medium mb-1 text-[var(--foreground)]">Skills (Max 20)</label>
          <div className="flex flex-wrap gap-2 mb-2">
            {skills.map(skill => (
              <span key={skill} className="bg-gray-100 text-sm px-2 py-1 rounded flex items-center gap-1">
                {skill}
                <button type="button" onClick={() => handleRemoveSkill(skill)} aria-label={`Remove skill ${skill}`} className="text-gray-700 hover:text-red-700">&times;</button>
              </span>
            ))}
          </div>
          <input 
            id={skillInputId}
            value={skillInput}
            onChange={e => setSkillInput(e.target.value)}
            onKeyDown={handleAddSkill}
            placeholder="Type a skill and press Enter"
            className="w-full p-2 border border-gray-300 rounded-[var(--radius)]"
            disabled={skills.length >= 20}
          />
        </div>

        <div>
          <label htmlFor={linkInputId} className="block text-sm font-medium mb-1 text-[var(--foreground)]">Portfolio Links (Max 10)</label>
          <div className="flex flex-col gap-2 mb-2">
            {links.map(link => (
              <span key={link} className="bg-gray-100 text-sm px-2 py-1 rounded flex items-center justify-between">
                <a href={link} target="_blank" rel="noreferrer" className="text-[var(--primary)] underline underline-offset-2 truncate max-w-[80%]">{link}</a>
                <button type="button" onClick={() => handleRemoveLink(link)} aria-label={`Remove link ${link}`} className="text-gray-700 hover:text-red-700">&times;</button>
              </span>
            ))}
          </div>
          <input 
            id={linkInputId}
            value={linkInput}
            onChange={e => setLinkInput(e.target.value)}
            onKeyDown={handleAddLink}
            placeholder="https://... (Press Enter to add)"
            className="w-full p-2 border border-gray-300 rounded-[var(--radius)]"
            disabled={links.length >= 10}
          />
        </div>

        <button 
          type="submit" 
          disabled={loading}
          className="bg-[var(--primary)] text-white p-2 rounded-[var(--radius)] mt-2 hover:opacity-90 disabled:opacity-50 font-medium self-start px-6"
        >
          {loading ? 'Saving...' : 'Save Profile'}
        </button>
      </form>
    </div>
  )
}
