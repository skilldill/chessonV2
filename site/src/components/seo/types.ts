export type ActionLink = {
  label: string;
  href: string;
};

export type HeroData = {
  h1: string;
  kicker: string;
  summary: string;
  primaryCta: ActionLink;
  secondaryCta: ActionLink;
  ghostCta?: ActionLink;
};

export type ValueProp = {
  title: string;
  description: string;
};

export type StepItem = {
  title: string;
  description: string;
};

export type UseCase = {
  title: string;
  description: string;
};

export type InternalLink = {
  title: string;
  description: string;
  href: string;
};

export type FaqItem = {
  question: string;
  answer: string;
};
