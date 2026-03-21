# NyumbaSwift Testing Data

## Seed command

Run the following from the project root:

```powershell
python seed_test_data.py
```

All seeded accounts use the same password:

```text
testpass123
```

## Testing accounts

| Role | Name | Phone | Email | Notes |
| --- | --- | --- | --- | --- |
| Admin | Amina Admin | 0711000001 | admin.testing@nyumbaswift.local | Admin dashboard and approvals |
| Landlord | Lydia Landlord | 0711000002 | lydia.landlord@nyumbaswift.local | Owns two active listings |
| Landlord | Musa Landlord | 0711000003 | musa.landlord@nyumbaswift.local | Owns one active family house |
| Agent | Neema Agent | 0711000004 | neema.agent@nyumbaswift.local | Approved verified agent |
| Agent | Kelvin Agent | 0711000005 | kelvin.agent@nyumbaswift.local | Approved verified agent |
| Renter | Rehema Renter | 0711000006 | rehema.renter@nyumbaswift.local | Active tenant on Mikocheni apartment |
| Renter | Juma Renter | 0711000007 | juma.renter@nyumbaswift.local | Active tenant on Temeke house |
| Agent Pending | Zawadi Broker | 0711000008 | zawadi.broker@nyumbaswift.local | Pending agent application |
| Renter Pending | Asha Pending | 0711000009 | asha.pending@nyumbaswift.local | Pending verification review with ID image |
| Renter Rejected | Baraka Rejected | 0711000010 | baraka.rejected@nyumbaswift.local | Rejected verification scenario for profile UX |

## Seeded agents

| Agent | Status | Business | Districts | Rating |
| --- | --- | --- | --- | --- |
| Neema Agent | approved | Neema Homes Advisory | Kinondoni, Ilala | 4.8 |
| Kelvin Agent | approved | Kelvin Rentals Desk | Temeke, Ubungo | 4.6 |
| Zawadi Broker | pending | Zawadi Property Connect | Kinondoni, Temeke | 0.0 |

## Seeded properties and images

| Property | Owner | District | Rent (TZS) | Photos |
| --- | --- | --- | --- | --- |
| 2BR Furnished Apartment in Mikocheni | Lydia Landlord | Kinondoni | 850000 | 2 image URLs |
| Modern Studio near Kariakoo | Lydia Landlord | Ilala | 420000 | 2 image URLs |
| 3BR Family House in Temeke | Musa Landlord | Temeke | 650000 | 2 image URLs |
| Affordable Ensuite Room in Ubungo | Musa Landlord | Ubungo | 260000 | 2 image URLs |
| Executive 3BR Apartment in Masaki | Lydia Landlord | Kinondoni | 1800000 | 2 image URLs |
| Beachside 4BR House in Kigamboni | Musa Landlord | Kigamboni | 1250000 | 2 image URLs |
| Street Front Commercial Space in Ilala | Lydia Landlord | Ilala | 900000 | 2 image URLs |
| New Studio Apartment in Mbezi Beach | Musa Landlord | Kinondoni | 380000 | 2 image URLs |

## Seeded rentals and payment state

| Property | Tenant | Status | Payment Month | Payment Status |
| --- | --- | --- | --- | --- |
| 2BR Furnished Apartment in Mikocheni | Rehema Renter | active | current month | completed |
| 3BR Family House in Temeke | Juma Renter | active | current month | pending |

## Verification scenario quick checks

- **Admin review**: log in as `Amina Admin` and review `Asha Pending` from the dashboard verification area.
- **Verified renter state**: log in as `Rehema Renter` to confirm the completed verification profile state.
- **Rejected state**: log in as `Baraka Rejected` to confirm the rejected verification path and resubmission UX.

## Notes

- The seed script is idempotent and updates existing seeded records by phone/title instead of creating duplicates.
- Property images are seeded as remote image URLs in the `property_photos` table.
- Listing unlock records are also seeded so renter flows have sample unlocked data.
