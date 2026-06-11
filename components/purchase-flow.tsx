import { BadgeCheck, CreditCard, KeyRound, LayoutDashboard, MailCheck } from "lucide-react";

const steps = [
  { label: "Cadastro", icon: KeyRound },
  { label: "Verificação", icon: MailCheck },
  { label: "Pagamento", icon: CreditCard },
  { label: "Painel", icon: LayoutDashboard },
];

export function PurchaseFlowStepper({ currentStep }: { currentStep: number }) {
  return (
    <div className="rounded-[26px] border border-white/75 bg-white/58 p-3 shadow-[0_18px_60px_rgba(38,31,45,0.08)] backdrop-blur-xl">
      <div className="grid gap-2 sm:grid-cols-4">
        {steps.map((step, index) => {
          const stepNumber = index + 1;
          const active = stepNumber === currentStep;
          const done = stepNumber < currentStep;
          const Icon = step.icon;

          return (
            <div
              key={step.label}
              className={`flex items-center gap-3 rounded-2xl px-3 py-3 text-sm font-semibold transition ${
                active
                  ? "bg-[#261f2d] text-white shadow-[0_18px_50px_rgba(38,31,45,0.18)]"
                  : done
                    ? "bg-[#e8f3df] text-[#245b3c]"
                    : "bg-white/62 text-[#7a6c62]"
              }`}
            >
              <span
                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
                  active
                    ? "bg-white/12 text-[#ffd7a4]"
                    : done
                      ? "bg-white text-[#245b3c]"
                      : "bg-[#f6efe7] text-[#9b8d82]"
                }`}
              >
                {done ? <BadgeCheck className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
              </span>
              <span>
                <span className="block text-[0.68rem] uppercase tracking-[0.18em] opacity-60">
                  Etapa {stepNumber}
                </span>
                {step.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
