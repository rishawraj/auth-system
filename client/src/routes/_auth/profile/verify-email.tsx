import { useMutation } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { FormEvent, useState } from "react";

import { verifyEmail } from "../../../queries/adminDashboardUsers";
import { setToken } from "../../../utils/authToken";

export const Route = createFileRoute("/_auth/profile/verify-email")({
  component: RouteComponent,
});

function RouteComponent() {
  const naviate = useNavigate();

  const [code, setCode] = useState("");

  const verifyMutation = useMutation({
    mutationFn: verifyEmail,
    onSuccess: (data) => {
      console.log("verified", data);
      setToken(data.accessToken);
      alert("email updated");
      naviate({ to: "/profile" });
    },
    onError: (error) => {
      console.error(error.message);
    },
  });

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    verifyMutation.mutate(code);
  }

  return (
    <div className="container m-auto bg-red-400 p-4">
      <form onSubmit={handleSubmit} className="flex">
        <label htmlFor="code">Enter Code</label>

        <input
          type="text"
          id="code"
          value={code}
          onChange={(e) => setCode(e.target.value)}
        />

        <button type="submit" disabled={verifyMutation.isPending}>
          {verifyMutation.isPending ? "Verifying..." : "Verify Email"}
        </button>

        {verifyMutation.isError && <p>{verifyMutation.error.message}</p>}

        {verifyMutation.isSuccess && <p>Email verified successfully!</p>}
      </form>
    </div>
  );
}
