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
    <div className="sidebar">
      {/* Avatar Upload Section */}
      <div className="sidebar-card">
        <h3 className="sidebar-title">
          📸 Character Avatar
        </h3>
        
        {avatarPreview ? (
          <div className="avatar-preview">
            <div className="avatar-image">
              <img 
                src={avatarPreview} 
                alt="Avatar preview" 
              />
            </div>
            <p className="avatar-success">Avatar uploaded successfully!</p>
            <button
              type="button"
              onClick={onRemoveAvatar}
              className="btn btn-outline btn-sm"
            >
              Remove Avatar
            </button>
          </div>
        ) : (
          <div className="avatar-upload">
            <div className="upload-content">
              <div className="upload-icon">🖼️</div>
              <p className="upload-title">Upload Avatar</p>
              <p className="upload-subtitle">JPG, PNG, GIF - Max 5MB</p>
            </div>
            <label className="btn btn-primary btn-upload">
              Choose Image
              <input
                type="file"
                accept="image/*"
                onChange={onImageUpload}
                style={{ display: 'none' }}
              />
            </label>
          </div>
        )}
        
        <p className="avatar-hint">
          💡 This avatar will be displayed in the character gallery and chat interface
        </p>
      </div>

      {/* Navigation Menu */}
      <div className="sidebar-card">
        <h3 className="sidebar-title">
          📚 Character Sections
        </h3>
        <nav className="sidebar-nav">
          {sections.map((section) => (
            <button
              key={section.id}
              type="button"
              onClick={() => onSectionChange(section.id)}
              className={`nav-button ${activeSection === section.id ? 'active' : ''}`}
            >
              <span className="nav-icon">{section.icon}</span>
              <span className="nav-label">{section.label}</span>
            </button>
          ))}
        </nav>
      </div>
    </div>
  );
}