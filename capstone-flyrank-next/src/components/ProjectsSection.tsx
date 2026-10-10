'use client'

import { useState } from 'react'
import { saveProject, deleteProject } from '@/app/profile/actions'

type Project = {
  id: string
  title: string
  description: string | null
  link: string | null
}

export default function ProjectsSection({ projects }: { projects: Project[] }) {
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ text: string, type: 'success' | 'error' } | null>(null)
  const [editingProject, setEditingProject] = useState<Project | null>(null)
  const [isAdding, setIsAdding] = useState(false)

  const handleSubmit = async (formData: FormData) => {
    setLoading(true)
    setMessage(null)
    
    const result = await saveProject(formData, editingProject?.id)
    
    if (result.error) {
      setMessage({ text: result.error, type: 'error' })
    } else {
      setMessage({ text: 'Project saved successfully!', type: 'success' })
      setEditingProject(null)
      setIsAdding(false)
    }
    setLoading(false)
  }

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this project?')) {
      setLoading(true)
      const result = await deleteProject(id)
      if (result.error) setMessage({ text: result.error, type: 'error' })
      else setMessage({ text: 'Project deleted.', type: 'success' })
      setLoading(false)
    }
  }

  return (
    <div className="p-6 border border-gray-200 rounded-[var(--radius)] bg-[var(--background)] shadow-sm mt-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold text-[var(--foreground)]">Projects</h2>
        {!isAdding && !editingProject && (
          <button 
            onClick={() => setIsAdding(true)}
            className="text-sm bg-[var(--primary)] text-white px-3 py-1 rounded-[var(--radius)] hover:opacity-90"
          >
            + Add Project
          </button>
        )}
      </div>

      {message && (
        <div className={`mb-4 p-3 rounded-[var(--radius)] text-sm ${message.type === 'error' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
          {message.text}
        </div>
      )}

      {(isAdding || editingProject) ? (
        <form action={handleSubmit} className="flex flex-col gap-4 bg-gray-50 p-4 rounded border mb-4">
          <h3 className="font-semibold">{editingProject ? 'Edit Project' : 'New Project'}</h3>
          <div>
            <label className="block text-sm font-medium mb-1">Title *</label>
            <input 
              name="title" 
              defaultValue={editingProject?.title || ''} 
              required 
              className="w-full p-2 border border-gray-300 rounded-[var(--radius)]"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Description</label>
            <textarea 
              name="description" 
              defaultValue={editingProject?.description || ''} 
              className="w-full p-2 border border-gray-300 rounded-[var(--radius)] h-24"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Link</label>
            <input 
              name="link" 
              type="url"
              defaultValue={editingProject?.link || ''} 
              placeholder="https://"
              className="w-full p-2 border border-gray-300 rounded-[var(--radius)]"
            />
          </div>
          <div className="flex gap-2 mt-2">
            <button 
              type="submit" 
              disabled={loading}
              className="bg-[var(--primary)] text-white px-4 py-2 rounded-[var(--radius)] hover:opacity-90 disabled:opacity-50 text-sm"
            >
              {loading ? 'Saving...' : 'Save'}
            </button>
            <button 
              type="button" 
              onClick={() => { setIsAdding(false); setEditingProject(null); }}
              className="bg-gray-200 text-gray-800 px-4 py-2 rounded-[var(--radius)] hover:bg-gray-300 text-sm"
            >
              Cancel
            </button>
          </div>
        </form>
      ) : null}

      <div className="flex flex-col gap-4">
        {projects.length === 0 && !isAdding ? (
          <p className="text-[var(--muted)] text-sm italic">No projects added yet.</p>
        ) : (
          projects.map(project => (
            <div key={project.id} className="border p-4 rounded-[var(--radius)] flex justify-between items-start">
              <div>
                <h4 className="font-semibold text-lg">{project.title}</h4>
                {project.link && <a href={project.link} target="_blank" rel="noreferrer" className="text-sm text-[var(--primary)] hover:underline block mb-1">{project.link}</a>}
                {project.description && <p className="text-sm text-[var(--muted)] whitespace-pre-wrap">{project.description}</p>}
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={() => setEditingProject(project)}
                  className="text-sm text-blue-600 hover:underline"
                  disabled={loading}
                >
                  Edit
                </button>
                <button 
                  onClick={() => handleDelete(project.id)}
                  className="text-sm text-red-600 hover:underline"
                  disabled={loading}
                >
                  Delete
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
