"use client";
import TerminalLoginForm from "../../../components/TerminalLoginForm";

export default function AdminLoginPage() {
  return (
    <TerminalLoginForm
      portal="admin"
      title="System Administration"
      showDevLogin={true}
    />
  );
}
