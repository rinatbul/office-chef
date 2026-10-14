export const MatchResults = ({ result }) => {
  if (!result) {
    return (
      <p className="empty">
        Нажмите «Собрать компании» — алгоритм сгруппирует коллег по кухне, формату
        и насыщенности.
      </p>
    )
  }

  return (
    <div className="match-results">
      <p className="match-summary">{result.summary}</p>
      <div className="match-grid">
        {result.groups.map((group) => (
          <article key={group.id} className="match-card">
            <header>
              <h3>{group.title}</h3>
              <span>{group.size} чел.</span>
            </header>
            <p className="muted">{group.suggestion}</p>
            <ul className="member-list">
              {group.members.map((member) => (
                <li key={member.employeeId}>
                  <strong>{member.name}</strong>
                  <span>
                    {member.cuisine} · {member.format} · {member.intensity}
                  </span>
                  {member.notes ? <em>{member.notes}</em> : null}
                </li>
              ))}
            </ul>
            <ul className="reason-list">
              {group.reasons.map((reason) => (
                <li key={reason}>{reason}</li>
              ))}
            </ul>
          </article>
        ))}
      </div>
    </div>
  )
}
