"use client";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/Button";
import { Field, SelectField } from "@/components/ui/Field";
import { applyServerError } from "@/hooks/useServerErrors";
import { useAuth } from "@/hooks/useAuth";
import { homeForRole } from "@/lib/roles";
import {
  LANGUAGES,
  citizenRegisterSchema,
  servantRegisterSchema,
} from "@/lib/validators";
import { authService } from "@/services/authService";
import { cn } from "@/utils/cn";
import { FormAlert } from "./AuthShell";

type Type = "CITIZEN" | "PUBLIC_SERVANT";
// Union of both shapes so one form component can render either account type.
type FormValues = Record<string, string>;

function TypeToggle({
  value,
  onChange,
}: {
  value: Type;
  onChange: (t: Type) => void;
}) {
  const opts: [Type, string][] = [
    ["CITIZEN", "Citizen"],
    ["PUBLIC_SERVANT", "Public servant"],
  ];
  return (
    <div
      role="tablist"
      aria-label="Account type"
      className="mb-[clamp(0.5rem,2svh,1.25rem)] grid grid-cols-2 rounded border border-line bg-sunken p-0.5"
    >
      {opts.map(([v, l]) => (
        <button
          key={v}
          type="button"
          role="tab"
          aria-selected={value === v}
          onClick={() => onChange(v)}
          className={cn(
            "h-8 rounded text-sm font-medium transition",
            value === v
              ? "bg-surface text-fg shadow-card"
              : "text-muted hover:text-fg",
          )}
        >
          {l}
        </button>
      ))}
    </div>
  );
}

const PASSWORD_RULE =
  "Password: at least 8 characters with upper case, lower case and a number.";

function Form({ type }: { type: Type }) {
  const router = useRouter();
  const { setUser } = useAuth();
  const [error, setError] = useState("");
  const servant = type === "PUBLIC_SERVANT";
  const {
    register,
    handleSubmit,
    setError: setFieldError,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(
      servant ? servantRegisterSchema : citizenRegisterSchema,
    ) as never,
    defaultValues: { accountType: type, preferredLanguage: "en" },
  });
  const f = (
    name: string,
    label: string,
    extra: React.InputHTMLAttributes<HTMLInputElement> & { hint?: string } = {},
  ) => (
    <Field
      label={label}
      error={errors[name]?.message as string | undefined}
      {...extra}
      {...register(name)}
    />
  );

  const onSubmit = handleSubmit(async (data) => {
    setError("");
    try {
      const user = await authService.register(data as never);
      setUser(user);
      router.replace(homeForRole(user.role));
    } catch (e) {
      setError(applyServerError(e, setFieldError));
    }
  });

  return (
    <form
      onSubmit={onSubmit}
      noValidate
      className="space-y-[clamp(0.5rem,2svh,1.25rem)]"
    >
      {error && <FormAlert>{error}</FormAlert>}
      {servant && (
        <p className="rounded bg-info/10 px-3 py-1.5 text-xs text-info">
          Public servant accounts start as pending and need administrator
          approval before they can act on reports.
        </p>
      )}
      {/* Field height and row gaps scale with the screen height (svh), so the form is tall on big screens
          yet always fits a single screen. The longer public-servant form uses 3 columns on large screens. */}
      <div
        className={cn(
          "grid gap-x-4 gap-y-[clamp(0.5rem,2svh,1.5rem)] sm:grid-cols-2 [&_label]:mb-1 [&_label]:text-[13px]",
          servant
            ? "lg:grid-cols-3 [&_input]:h-[clamp(2rem,4.6svh,2.75rem)] [&_select]:h-[clamp(2rem,4.6svh,2.75rem)]"
            : "[&_input]:h-[clamp(2rem,5.2svh,3rem)] [&_select]:h-[clamp(2rem,5.2svh,3rem)]",
        )}
      >
        {f("fullName", "Full name", {
          autoComplete: "name",
          className: servant ? undefined : "sm:col-span-2",
        })}
        {f("email", servant ? "Official email" : "Email", {
          type: "email",
          autoComplete: "email",
        })}
        {f("phone", "Phone", {
          type: "tel",
          autoComplete: "tel",
          placeholder: "9876543210",
        })}
        {servant && (
          <>
            {f("department", "Department")}
            {f("designation", "Designation")}
            {f("officialId", "Official ID")}
            {f(
              "municipalityName",
              "Municipality / Nagar Nigam / Nagar Palika",
              { className: "sm:col-span-2" },
            )}
            {f("ward", "Ward")}
          </>
        )}
        {f("city", "City")}
        {f("state", "State")}
        <SelectField
          label="Preferred language"
          error={errors.preferredLanguage?.message as string | undefined}
          {...register("preferredLanguage")}
        >
          {LANGUAGES.map((l) => (
            <option key={l.code} value={l.code}>
              {l.label}
            </option>
          ))}
        </SelectField>
        {!servant && (
          <p className="hidden items-end text-xs leading-snug text-muted sm:flex">
            {PASSWORD_RULE}
          </p>
        )}
        {f("password", "Password", {
          type: "password",
          autoComplete: "new-password",
        })}
        {f("confirmPassword", "Confirm password", {
          type: "password",
          autoComplete: "new-password",
        })}
        {servant && (
          <p className="hidden items-end text-xs leading-snug text-muted lg:flex">
            {PASSWORD_RULE}
          </p>
        )}
      </div>
      <p
        className={cn(
          "text-xs text-muted",
          servant ? "lg:hidden" : "sm:hidden",
        )}
      >
        {PASSWORD_RULE}
      </p>
      <Button
        type="submit"
        className="!h-[clamp(2.25rem,5.2svh,3rem)] w-full"
        loading={isSubmitting}
      >
        Create account
      </Button>
    </form>
  );
}

export function RegisterForm() {
  const [type, setType] = useState<Type>("CITIZEN");
  return (
    <div data-servant={type === "PUBLIC_SERVANT"}>
      <TypeToggle value={type} onChange={setType} />
      <Form key={type} type={type} />
    </div>
  );
}
