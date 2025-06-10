'use client';

interface Section {
  id: string;
  label: string;
  icon: string;
}

interface SidebarProps {
  sections: Section[];
  activeSection: string;
  onSectionChange: (sectionId: string) => void;
  avatarPreview: string | null;
  onImageUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onRemoveAvatar: () => void;
}

export default function Sidebar({
  sections,
  activeSection,
  onSectionChange,
  avatarPreview,
  onImageUpload,
  onRemoveAvatar
}: SidebarProps) {
  return (
    <div className="space-y-6">
      {/* Avatar Upload Section */}
      <div className="card-romantic p-6">
        <h3 className="text-lg font-bold text-slate-100 mb-4 flex items-center gap-2">
          📸 Character Avatar
        </h3>
        
        {avatarPreview ? (
          <div className="space-y-4">
            <div className="flex justify-center">
              <div className="w-32 h-32 rounded-lg overflow-hidden border-2 border-slate-600">
                <img 
                  src={avatarPreview} 
                  alt="Avatar preview" 
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
            <p className="text-green-400 text-sm text-center">Avatar uploaded successfully!</p>
            <button
              type="button"
              onClick={onRemoveAvatar}
              className="btn-romantic-outline w-full text-sm"
            >
              Remove Avatar
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="border-2 border-dashed border-slate-600 rounded-lg p-6 text-center hover:border-rose-500 transition-colors duration-200">
              <div className="text-4xl mb-2">🖼️</div>
              <p className="text-slate-300 font-medium mb-1">Upload Avatar</p>
              <p className="text-slate-500 text-sm mb-4">JPG, PNG, GIF - Max 5MB</p>
              <label className="btn-romantic-primary cursor-pointer">
                Choose Image
                <input
                  type="file"
                  accept="image/*"
                  onChange={onImageUpload}
                  className="hidden"
                />
              </label>
            </div>
          </div>
        )}
        
        <p className="text-slate-400 text-xs mt-4 flex items-start gap-2">
          <span>💡</span>
          <span>This avatar will be displayed in the character gallery and chat interface</span>
        </p>
      </div>

      {/* Navigation Menu */}
      <div className="card-romantic p-6">
        <h3 className="text-lg font-bold text-slate-100 mb-4 flex items-center gap-2">
          📚 Character Sections
        </h3>
        <nav className="space-y-2">
          {sections.map((section) => (
            <button
              key={section.id}
              type="button"
              onClick={() => onSectionChange(section.id)}
              className={`w-full text-left px-4 py-3 rounded-lg font-medium transition-all duration-200 flex items-center gap-3 ${
                activeSection === section.id
                  ? 'bg-gradient-to-r from-rose-600/20 to-pink-600/20 text-rose-400 border border-rose-500/30 shadow-lg'
                  : 'text-slate-300 hover:bg-slate-700/50 hover:text-rose-400 border border-transparent'
              }`}
            >
              <span className="text-lg">{section.icon}</span>
              <span>{section.label}</span>
            </button>
          ))}
        </nav>
      </div>
    </div>
  );
}