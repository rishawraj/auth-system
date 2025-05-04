import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/about")({
  component: About,
});

function About() {
  return (
    <div>
      <h1>About</h1>
      <p>This is the about page.</p>
      {/* create  a drop down */}
      <details>
        <summary>More Info</summary>
        <p>This is some more information about the about page.</p>
        <p>
          This is some more information about the about page. This is some more
          information about the about page. This is some more information about
          the about page. This is some more information about the about page.
          This is some more information about the about page. This is some more
        </p>
      </details>
    </div>
  );
}
