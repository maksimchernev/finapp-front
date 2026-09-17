import { decodeVapidPublicKey, isInstalledPwa } from "@/features/credit-card-push/lib/pushSubscription";

jest.mock("@/shared/api/client", () => ({ request: jest.fn() }));

test("only installed standalone web apps can enable reminders", () => {
  expect(isInstalledPwa(false, false)).toBe(false);
  expect(isInstalledPwa(true, false)).toBe(true);
  expect(isInstalledPwa(false, true)).toBe(true);
});

test("VAPID public key is decoded from URL safe base64", () => {
  expect(Array.from(decodeVapidPublicKey("AQID-_8"))).toEqual([1, 2, 3, 251, 255]);
});
