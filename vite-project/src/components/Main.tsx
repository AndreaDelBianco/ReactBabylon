import { useAppStore } from "@/stores/appStore.ts";
import { AppBreadcrumb } from "./AppBreadcrumb.tsx";
import { MugsList } from "../features/mugs-list/components/MugsList.tsx";

import { PageHeading } from "./PageHeading.tsx";
import { MugsConfigurator } from "@/features/mugs-configurator/components/MugsConfigurator.tsx";

export const Main = () => {
  // Ottiene selectedPage dallo store Zustand.
  const selectedPage = useAppStore((state) => state.selectedPage);

  return (
    <main className="my-8 flex h-full w-full flex-col gap-4 px-64">
      {selectedPage === "mugs" && (
        <>
          <AppBreadcrumb pageName="Tazze" />
          <div className="flex h-[calc(100dvh-14.25rem)] flex-col gap-4">
            <PageHeading
              title="Tazze"
              paragraph="Dai un'occhiata alla nostra grandiosissima offerta di tazze."
            />
            <MugsList />
          </div>
        </>
      )}
      {selectedPage === "configurator" && (
        <>
          <AppBreadcrumb pageName="Configuratore" />
          <div className="flex h-[calc(100dvh-14.25rem)] flex-col gap-4">
            <PageHeading
              title="La tua tazza, le tue regole."
              paragraph="Perché anche un sorso di caffè merita il tuo tocco personale."
            />
            <MugsConfigurator />
          </div>
        </>
      )}
    </main>
  );
};

{
  /* <main className="my-8 flex h-full w-full flex-col gap-4 px-64">
  {selectedPage === "mugs" && <AppBreadcrumb pageName="Tazze" />}
  {selectedPage === "configurator" && (
    <AppBreadcrumb pageName="Configuratore" />
  )}
  <div
    className={clsx("flex h-[calc(100dvh-14.25rem)] flex-col gap-4", {
      hidden: selectedPage === "configurator",
    })}
  >
    <PageHeading
      title="Tazze"
      paragraph="Dai un'occhiata alla nostra grandiosissima offerta di tazze."
    />
    <MugsList />
  </div>
  <div
    className={clsx("flex h-[calc(100dvh-14.25rem)] flex-col gap-4", {
      hidden: selectedPage === "mugs",
    })}
  >
    <PageHeading
      title="La tua tazza, le tue regole."
      paragraph="Perché anche un sorso di caffè merita il tuo tocco personale."
    />
    <MugsConfigurator />
  </div>
</main> */
}

{
  /* <main className="my-8 flex h-full w-full flex-col gap-4 px-64">
  {selectedPage === "mugs" && (
    <>
      <AppBreadcrumb pageName="Tazze" />
      <div className="flex h-[calc(100dvh-14.25rem)] flex-col gap-4">
        <PageHeading
          title="Tazze"
          paragraph="Dai un'occhiata alla nostra grandiosissima offerta di tazze."
        />
        <MugsList />
      </div>
    </>
  )}
  {selectedPage === "configurator" && (
    <>
      <AppBreadcrumb pageName="Configuratore" />
      <div className="flex h-[calc(100dvh-14.25rem)] flex-col gap-4">
        <PageHeading
          title="La tua tazza, le tue regole."
          paragraph="Perché anche un sorso di caffè merita il tuo tocco personale."
        />
        <MugsConfigurator />
      </div>
    </>
  )}
</main> */
}
