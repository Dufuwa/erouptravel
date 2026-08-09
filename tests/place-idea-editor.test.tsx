import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { PlaceIdeaEditor } from "@/components/place-idea-dialogs";
import type { City } from "@/types/types";

const cities: City[] = [{ id: "prague", name: "布拉格", englishName: "Prague", country: "捷克", arrivalDate: "2027-03-27", departureDate: "2027-03-31", nights: 4 }];

describe("PlaceIdeaEditor", () => {
  it("驗證 Google Maps 網址並儲存收藏", async () => {
    const onSave = vi.fn().mockResolvedValue(undefined);
    render(<PlaceIdeaEditor open cities={cities} nextSortOrder={0} onClose={() => undefined} onSave={onSave} />);
    fireEvent.change(screen.getByLabelText("景點名稱"), { target: { value: "布拉格城堡" } });
    fireEvent.change(screen.getByLabelText("Google Maps 網址"), { target: { value: "https://example.com/not-google" } });
    fireEvent.click(screen.getByRole("button", { name: "儲存" }));
    await waitFor(() => expect(onSave).not.toHaveBeenCalled());
    fireEvent.change(screen.getByLabelText("Google Maps 網址"), { target: { value: "https://maps.app.goo.gl/example" } });
    fireEvent.click(screen.getByRole("button", { name: "儲存" }));
    await waitFor(() => expect(onSave).toHaveBeenCalledWith(expect.objectContaining({ name: "布拉格城堡", googleMapsUrl: "https://maps.app.goo.gl/example", scheduledDayIds: [] })));
  });
});
