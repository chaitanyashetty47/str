import { PasswordResetClient } from "./password-reset-client";
import { FormMessage, Message } from "@/components/form-message";

export default async function ResetPassword(props: {
  searchParams: Promise<Message>;
}) {
  const searchParams = await props.searchParams;
  
  return (
    <PasswordResetClient searchParams={searchParams} />
  );
}
