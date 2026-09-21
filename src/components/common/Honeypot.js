/** Off-screen rather than display:none, which some bots know to skip. */
const HIDDEN = { position: 'absolute', left: '-10000px', width: 1, height: 1, overflow: 'hidden' };

/**
 * A form field visitors never see or reach. Bots that fill in every input give themselves away,
 * and the API quietly drops their submission (the `website` field in src/server/validation.js).
 */
export default function Honeypot({ value, onChange }) {
  return (
    <div style={HIDDEN} aria-hidden="true">
      <label>
        Website
        <input
          type="text"
          name="website"
          tabIndex={-1}
          autoComplete="off"
          value={value}
          onChange={(event) => onChange(event.target.value)}
        />
      </label>
    </div>
  );
}
