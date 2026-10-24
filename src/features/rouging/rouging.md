# Rouging

Field rouging records. Grade and geo location are not part of this API.

All routes require authentication. Base path: `/api/v1/rougings`.

## Fields

| Field | Required on create | Notes |
| --- | --- | --- |
| `fieldId` | yes | Farmer field id |
| `startDate` | yes | `YYYY-MM-DD` |
| `endDate` | yes | `YYYY-MM-DD`, on or after `startDate` |
| `virusInfectedPlantsRemoved` | no | Decimal, `0` or greater. Send `null` on update to clear |
| `offVarietyTypeRemoval` | no | Decimal, `0` or greater. Send `null` on update to clear |
| `mediaUrls` | no | Upload images with the `rougingImage` slot, then send the returned URLs |
| `remarks` | no | Send `null` on update to clear |

## Routes

- `GET /api/v1/rougings` lists rougings. Optional query: `fieldId`.
- `GET /api/v1/rougings/:id` returns one rouging.
- `POST /api/v1/rougings` creates a rouging. The signed-in user is stored as `createdBy`.
- `PUT /api/v1/rougings/:id` updates a rouging. Send at least one field. Omitted fields stay as they are.
- `DELETE /api/v1/rougings/:id` deletes a rouging.

Responses include the field (`id`, `name`, `acres`, `farmerId`) and the user who created the record (`id`, `name`, `email`).
