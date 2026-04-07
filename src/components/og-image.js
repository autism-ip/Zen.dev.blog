export const OpenGraphImage = ({ title, description, icon, url }) => {
  return (
    <div style={{ display: 'flex', position: 'relative', height: '100%', width: '100%', backgroundColor: 'white' }}>
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundImage:
            'linear-gradient(to right, #80808012 1px, transparent 1px), linear-gradient(to bottom, #80808012 1px, transparent 1px)',
          backgroundSize: '24px 24px'
        }}
      />
      <div
        style={{
          position: 'absolute',
          top: '64px',
          left: '64px',
          display: 'flex',
          borderRadius: '9999px',
          backgroundColor: 'black',
          padding: '12px 20px'
        }}
      >
        <span
          style={{ fontSize: '24px', lineHeight: 1, color: 'white' }}
        >{`zenhungyep.com${url ? `/${url}` : ''}`}</span>
      </div>
      <div
        style={{
          position: 'absolute',
          bottom: '96px',
          left: '64px',
          display: 'flex',
          width: '80%',
          flexDirection: 'column',
          gap: '8px'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          {icon && <span style={{ display: 'flex' }}>{icon}</span>}
          <span style={{ fontSize: '76px', lineHeight: 1, fontWeight: 600 }}>{title}</span>
        </div>
        {description && <span style={{ marginTop: '16px', fontSize: '40px', lineHeight: '48px' }}>{description}</span>}
      </div>
    </div>
  )
}
