"use client";

import { useSyncExternalStore } from "react";
import { ANGEBOT } from "./angebot";

const fristLaeuft = (iso: string) => new Date().toISOString().slice(0, 10) <= iso;
const subscribe = () => () => {};

/** True while the bonus deadline has not passed (checked in the visitor's browser, build-time value on the server). */
export function useFristAktiv(iso: string = ANGEBOT.fristIso) {
  return useSyncExternalStore(
    subscribe,
    () => fristLaeuft(iso),
    () => fristLaeuft(iso)
  );
}
