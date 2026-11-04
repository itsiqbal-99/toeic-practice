import { afterEach, describe, expect, it, vi } from "vitest";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { AudioPlayer } from "../../apps/web/src/components/test/audio-player";
const clips = [
  { src: "/one.mp3", speaker: "One" },
  { src: "/two.mp3", speaker: "Two" },
];
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});
describe("listening playback", () => {
  it("advances through clips and restarts from the first clip after completion", async () => {
    const play = vi
      .spyOn(HTMLMediaElement.prototype, "play")
      .mockResolvedValue();
    vi.spyOn(HTMLMediaElement.prototype, "pause").mockImplementation(() => {});
    const { container } = render(<AudioPlayer clips={clips} unitId="group" />);
    fireEvent.click(screen.getByRole("button", { name: "Play audio" }));
    await waitFor(() =>
      expect(screen.getByText("Now listening")).toBeVisible(),
    );
    fireEvent.ended(container.querySelector("audio")!);
    expect(container.querySelector("audio")).toHaveAttribute("src", "/two.mp3");
    fireEvent.canPlay(container.querySelector("audio")!);
    await waitFor(() => expect(play).toHaveBeenCalledTimes(2));
    fireEvent.ended(container.querySelector("audio")!);
    expect(screen.getByText("Playback complete")).toBeVisible();
    fireEvent.click(screen.getByRole("button", { name: "Restart audio" }));
    expect(container.querySelector("audio")).toHaveAttribute("src", "/one.mp3");
    fireEvent.canPlay(container.querySelector("audio")!);
    await waitFor(() => expect(play).toHaveBeenCalledTimes(3));
  });
  it("reserves strict playback once, permits retry after failure, and locks on resume", async () => {
    const play = vi
      .spyOn(HTMLMediaElement.prototype, "play")
      .mockRejectedValueOnce(new Error("Offline"))
      .mockResolvedValue();
    const reserve = vi.fn().mockResolvedValue(undefined);
    const { unmount } = render(
      <AudioPlayer clips={clips} unitId="strict" strict onBegin={reserve} />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Play audio" }));
    await waitFor(() =>
      expect(screen.getByRole("button", { name: "Retry audio" })).toBeEnabled(),
    );
    fireEvent.click(screen.getByRole("button", { name: "Retry audio" }));
    await waitFor(() => expect(play).toHaveBeenCalledTimes(2));
    expect(reserve).toHaveBeenCalledTimes(1);
    unmount();
    render(
      <AudioPlayer
        clips={clips}
        unitId="strict"
        strict
        played
        onBegin={reserve}
      />,
    );
    expect(
      screen.getByRole("button", { name: "Audio already played" }),
    ).toBeDisabled();
  });
});
