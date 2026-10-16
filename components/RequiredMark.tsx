// Visible required-field indicator for sighted users — the `required`
// attribute on the input itself already handles assistive-tech announcement
// and native validation; this is purely the visual signal that was missing
// (Stage P accessibility audit).
export function RequiredMark() {
  return (
    <span aria-hidden="true" className="text-espresso-500">
      {" "}
      *
    </span>
  );
}
