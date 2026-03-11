import Avatar from './Avatar'
import { theme } from '../theme'

function formatTimestamp(value) {
  if (!value) return ''
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return String(value)
  return d.toLocaleString()
}

export default function ThoughtCard({ post, onDelete }) {
  const name = post?.userName ?? 'Daily User'
  const createdAt = formatTimestamp(post?.createdAt)

  return (
    <article style={styles.card}>
      <div style={styles.header}>
        <div style={styles.userRow}>
          <Avatar name={name} size="sm" />
          <div style={{ minWidth: 0 }}>
            <div style={styles.userName}>{name}</div>
            <div style={styles.meta}>{createdAt}</div>
          </div>
        </div>
        {onDelete && (
          <button onClick={() => onDelete(post?.id)} style={styles.deleteBtn} aria-label="Delete thought">
            Delete
          </button>
        )}
      </div>

      <div style={styles.body}>
        <p style={styles.text}>{post?.text ?? ''}</p>
      </div>
    </article>
  )
}

const styles = {
  card: {
    background: theme.colors.warmWhite,
    borderRadius: theme.radius.xl,
    border: `1px solid ${theme.colors.border}`,
    boxShadow: theme.shadows.card,
    padding: '16px',
    marginBottom: '12px',
  },
  header: {
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: '12px',
    marginBottom: '10px',
  },
  userRow: { display: 'flex', gap: '10px', alignItems: 'center', minWidth: 0 },
  userName: {
    fontFamily: theme.fonts.display,
    fontSize: '13px',
    fontWeight: 700,
    color: theme.colors.ink,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    maxWidth: '360px',
  },
  meta: { fontFamily: theme.fonts.body, fontSize: '11.5px', color: theme.colors.inkMuted },
  deleteBtn: {
    border: `1px solid ${theme.colors.border}`,
    background: 'transparent',
    borderRadius: theme.radius.sm,
    padding: '6px 10px',
    fontFamily: theme.fonts.body,
    fontSize: '12px',
    cursor: 'pointer',
    color: theme.colors.rose,
  },
  body: { fontFamily: theme.fonts.body },
  text: { margin: 0, color: theme.colors.ink, fontSize: '14.5px', lineHeight: 1.6 },
}
