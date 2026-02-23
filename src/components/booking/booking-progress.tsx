import { cn } from "@/lib/utils";

const steps = [
  { id: 1, name: "Your Details" },
  { id: 2, name: "Choose Room" },
  { id: 3, name: "Review & Confirm" },
];

export function BookingProgress({ currentStep }: { currentStep: number }) {
  return (
    <div className="mb-12">
      <nav aria-label="Progress">
        <ol role="list" className="flex items-center">
          {steps.map((step, stepIdx) => (
            <li
              key={step.name}
              className={cn("relative", stepIdx !== steps.length - 1 ? "flex-1" : "")}
            >
              <>
                {step.id < currentStep ? (
                  // Completed step
                  <div className="flex items-center">
                    <span className="h-9 flex items-center">
                      <span className="relative z-10 w-8 h-8 flex items-center justify-center bg-primary rounded-full">
                        <svg className="w-5 h-5 text-white" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                          <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" />
                        </svg>
                      </span>
                    </span>
                    <span className="ml-4 text-sm font-medium text-primary">{step.name}</span>
                  </div>
                ) : step.id === currentStep ? (
                  // Current step
                  <div className="flex items-center" aria-current="step">
                    <span className="h-9 flex items-center">
                      <span className="relative z-10 w-8 h-8 flex items-center justify-center bg-background border-2 border-primary rounded-full">
                        <span className="text-primary">{step.id}</span>
                      </span>
                    </span>
                    <span className="ml-4 text-sm font-medium text-primary">{step.name}</span>
                  </div>
                ) : (
                  // Upcoming step
                  <div className="flex items-center">
                    <span className="h-9 flex items-center">
                      <span className="relative z-10 w-8 h-8 flex items-center justify-center bg-background border-2 border-border rounded-full">
                        <span className="text-muted-foreground">{step.id}</span>
                      </span>
                    </span>
                    <span className="ml-4 text-sm font-medium text-muted-foreground">{step.name}</span>
                  </div>
                )}
                {/* Connector */}
                {stepIdx !== steps.length - 1 ? (
                   <div className="absolute top-4 left-4 -ml-px mt-0.5 h-0.5 w-full bg-border" aria-hidden="true" />
                ) : null}
              </>
            </li>
          ))}
        </ol>
      </nav>
      <p className="text-center mt-2 text-muted-foreground font-semibold">
        Step {currentStep} of {steps.length}
      </p>
    </div>
  );
}
