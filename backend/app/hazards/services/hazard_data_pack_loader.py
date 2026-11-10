"""Data pack loader for authentic Indian hazard research datasets.

Parses and indexes:
- India_Flood_Inventory_v3.csv (IMD 6800+ historical flood events)
- District_FloodImpact.csv (732 district vulnerability & impact metrics)
- earthquake_events.csv (USGS 9700+ earthquake events)
- sentra_tsunami_events.csv (NOAA 3100+ tsunami event catalogue)
- ibtracs_north_indian_ocean.csv (IBTrACS North Indian Ocean cyclone database)
"""

from functools import lru_cache
import logging
import math
from pathlib import Path
from typing import Any, Dict, List, Optional
import pandas as pd
from app.hazards.base import HistoricalEvent
from app.schemas.risk_assessment import HazardType

logger = logging.getLogger("sentra.hazards.datapack")

DATA_DIR = Path(__file__).resolve().parent.parent / "data"

STATE_CODE_MAP = {
    "andhra pradesh": "AP",
    "arunachal pradesh": "AR",
    "assam": "AS",
    "bihar": "BR",
    "chhattisgarh": "CG",
    "goa": "GA",
    "gujarat": "GJ",
    "haryana": "HR",
    "himachal pradesh": "HP",
    "jharkhand": "JH",
    "karnataka": "KA",
    "kerala": "KL",
    "madhya pradesh": "MP",
    "maharashtra": "MH",
    "manipur": "MN",
    "meghalaya": "ML",
    "mizoram": "MZ",
    "nagaland": "NL",
    "odisha": "OD",
    "punjab": "PB",
    "rajasthan": "RJ",
    "sikkim": "SK",
    "tamil nadu": "TN",
    "telangana": "TS",
    "tripura": "TR",
    "uttar pradesh": "UP",
    "uttarakhand": "UK",
    "west bengal": "WB",
    "delhi": "DL",
    "jammu and kashmir": "JK",
    "ladakh": "LA",
    "andaman and nicobar": "AN",
}


def _normalize_state_code(state_str: Optional[str]) -> str:
    """Resolve state code from state name or code string."""
    if not state_str or pd.isna(state_str):
        return "IN"
    clean = str(state_str).strip().lower().split(",")[0].strip()
    return STATE_CODE_MAP.get(clean, clean[:2].upper())


class HazardDataPackLoader:
    """Enterprise loader with fast LRU caching and defensive file parsing."""

    def __init__(self, data_dir: Path = DATA_DIR):
        self.data_dir = data_dir

    @lru_cache(maxsize=1)
    def get_district_flood_impact_map(self) -> Dict[str, Dict[str, Any]]:
        """Return 732-district baseline impact metrics keyed by normalized district name."""
        path = self.data_dir / "District_FloodImpact.csv"
        if not path.exists():
            return {}
        try:
            df = pd.read_csv(path)
            res = {}
            for _, row in df.iterrows():
                dist = str(row.get("Dist_Name", "")).strip().lower()
                res[dist] = {
                    "district_name": row.get("Dist_Name"),
                    "human_fatality_historical": int(row.get("Human_fatality", 0)) if pd.notna(row.get("Human_fatality")) else 0,
                    "human_injured_historical": int(row.get("Human_injured", 0)) if pd.notna(row.get("Human_injured")) else 0,
                    "population": int(row.get("Population", 0)) if pd.notna(row.get("Population")) else 0,
                    "mean_flood_duration_days": float(row.get("Mean_Flood_Duration", 7.0)) if pd.notna(row.get("Mean_Flood_Duration")) else 7.0,
                }
            return res
        except Exception as e:
            logger.warning("Failed to load District_FloodImpact.csv: %s", e)
            return {}

    @lru_cache(maxsize=4)
    def load_flood_inventory_events(self, limit: int = 50) -> List[HistoricalEvent]:
        """Load top verified flood events from India_Flood_Inventory_v3.csv."""
        path = self.data_dir / "India_Flood_Inventory_v3.csv"
        if not path.exists():
            return []
        try:
            df = pd.read_csv(path, low_memory=False)
            df = df.dropna(subset=["Start Date", "Districts", "State"])
            df["parsed_date"] = pd.to_datetime(df["Start Date"], errors="coerce", format="mixed")
            df = df.dropna(subset=["parsed_date"])
            df["event_year"] = df["parsed_date"].dt.year.astype(int)

            # Sort by fatalities and recency to highlight impactful events
            df["fatality_numeric"] = pd.to_numeric(df["Human fatality"], errors="coerce").fillna(0)
            df = df.sort_values(by=["fatality_numeric", "event_year"], ascending=[False, False])

            events: List[HistoricalEvent] = []
            for _, row in df.head(limit).iterrows():
                uei = str(row.get("UEI", ""))
                dist = str(row.get("Districts", "")).split(",")[0].strip()
                state = str(row.get("State", "")).split(",")[0].strip()
                fatalities = int(row["fatality_numeric"])
                cause = str(row.get("Main Cause", "Heavy Monsoonal Inundation"))
                duration = float(row.get("Duration(Days)", 7.0)) if pd.notna(row.get("Duration(Days)")) else 7.0
                damage_desc = str(row.get("Extent of damage ", "")) if pd.notna(row.get("Extent of damage ")) else ""

                severity = "CRITICAL" if fatalities > 50 else ("HIGH" if fatalities > 10 else "MODERATE")

                events.append(
                    HistoricalEvent(
                        event_id=uei or f"FL-INV-{row['event_year']}-{dist[:4].upper()}",
                        event_name=f"{dist} ({state}) Monsoon Flood Event",
                        event_year=int(row["event_year"]),
                        hazard_type=HazardType.FLOOD,
                        state_code=_normalize_state_code(state),
                        state_name=state,
                        district_name=dist,
                        start_date=row["parsed_date"].strftime("%Y-%m-%d"),
                        severity=severity,
                        peak_metric_name="Flood Event Duration",
                        peak_metric_value=duration,
                        peak_metric_unit="days",
                        estimated_exposed_population=0,
                        reported_fatalities=fatalities,
                        economic_loss_inr_cr=0.0,
                        description=f"{cause}. {damage_desc}".strip(),
                        data_source="India Meteorological Department (IMD) Disaster Inventory v3",
                    )
                )
            return events
        except Exception as e:
            logger.warning("Failed to load India_Flood_Inventory_v3.csv: %s", e)
            return []

    @lru_cache(maxsize=4)
    def load_earthquake_events(self, limit: int = 50, min_mag: float = 5.2) -> List[HistoricalEvent]:
        """Load major earthquakes from earthquake_events.csv."""
        path = self.data_dir / "earthquake_events.csv"
        if not path.exists():
            return []
        try:
            df = pd.read_csv(path, low_memory=False)
            df = df[df["magnitude"] >= min_mag].copy()
            df["parsed_date"] = pd.to_datetime(df["timestamp"], errors="coerce")
            df = df.dropna(subset=["parsed_date"])
            df["event_year"] = df["parsed_date"].dt.year.astype(int)
            df = df.sort_values(by=["magnitude", "parsed_date"], ascending=[False, False])

            events: List[HistoricalEvent] = []
            for _, row in df.head(limit).iterrows():
                ev_id = str(row.get("event_id", ""))
                place = str(row.get("place", "South Asian Plate Boundary"))
                mag = float(row.get("magnitude", 5.0))
                depth = float(row.get("depth_km", 10.0))
                # Approximate PGA based on empirical Campbell & Bozorgnia relation
                approx_pga = round(0.05 * math.exp(0.5 * (mag - 5.0)) / (1.0 + depth / 30.0), 3)

                severity = "CRITICAL" if mag >= 6.5 else ("HIGH" if mag >= 5.8 else "MODERATE")

                events.append(
                    HistoricalEvent(
                        event_id=f"EQ-USGS-{ev_id}",
                        event_name=f"M{mag:.1f} Earthquake - {place}",
                        event_year=int(row["event_year"]),
                        hazard_type=HazardType.EARTHQUAKE,
                        state_code="IN",
                        state_name="Indian Subcontinent / Plate Margin",
                        district_name=place,
                        start_date=row["parsed_date"].strftime("%Y-%m-%d"),
                        severity=severity,
                        peak_metric_name="Peak Ground Acceleration (PGA)",
                        peak_metric_value=approx_pga,
                        peak_metric_unit="g",
                        estimated_exposed_population=0,
                        reported_fatalities=0,
                        economic_loss_inr_cr=0.0,
                        description=f"Magnitude {mag:.1f} seismic event recorded by USGS at depth {depth:.1f} km ({place}).",
                        data_source=f"USGS Earthquake Hazards Program Catalog ({str(row.get('source', 'USGS')).upper()})",
                    )
                )
            return events
        except Exception as e:
            logger.warning("Failed to load earthquake_events.csv: %s", e)
            return []

    @lru_cache(maxsize=4)
    def load_tsunami_events(self, limit: int = 50) -> List[HistoricalEvent]:
        """Load Indian Ocean and significant regional tsunami events from sentra_tsunami_events.csv."""
        path = self.data_dir / "sentra_tsunami_events.csv"
        if not path.exists():
            return []
        try:
            df = pd.read_csv(path, low_memory=False)
            # Prioritize Indian Ocean basin nations
            io_countries = ["INDIA", "SRI LANKA", "INDONESIA", "MYANMAR", "BANGLADESH", "MALDIVES", "THAILAND"]
            df_io = df[df["country"].str.upper().isin(io_countries)].copy()
            df_io["year_clean"] = pd.to_numeric(df_io["event_year"], errors="coerce").fillna(0).astype(int)
            # Filter modern era
            df_io = df_io[df_io["year_clean"] >= 1900]
            df_io = df_io.sort_values(by=["year_clean"], ascending=[False])

            events: List[HistoricalEvent] = []
            for _, row in df_io.head(limit).iterrows():
                ev_id = str(row.get("event_id", ""))
                country = str(row.get("country", "")).title()
                loc = str(row.get("location_name", country)).title()
                year = int(row["year_clean"])
                runup = float(row.get("max_water_height", 1.0)) if pd.notna(row.get("max_water_height")) else 1.0
                deaths = int(row.get("src_deathsTotal", 0)) if pd.notna(row.get("src_deathsTotal")) else 0
                eq_mag = float(row.get("eq_magnitude", 7.0)) if pd.notna(row.get("eq_magnitude")) else 7.0

                severity = "CRITICAL" if (runup > 5.0 or deaths > 100) else ("HIGH" if runup > 2.0 else "MODERATE")

                events.append(
                    HistoricalEvent(
                        event_id=f"TS-NOAA-{ev_id}",
                        event_name=f"{year} {loc} ({country}) Tsunami Wave Event",
                        event_year=year,
                        hazard_type=HazardType.TSUNAMI,
                        state_code="TN" if country.upper() == "INDIA" else "IO",
                        state_name=f"{country} / Indian Ocean Basin",
                        district_name=loc,
                        start_date=f"{year}-01-01",
                        severity=severity,
                        peak_metric_name="Maximum Coastal Wave Runup Height",
                        peak_metric_value=round(runup, 2),
                        peak_metric_unit="meters",
                        estimated_exposed_population=0,
                        reported_fatalities=deaths,
                        economic_loss_inr_cr=0.0,
                        description=f"Seismic-generated ocean wave following Mw {eq_mag:.1f} subsea event. Recorded max wave height {runup:.2f} m.",
                        data_source="NOAA National Centers for Environmental Information (NCEI) Global Tsunami Catalog",
                    )
                )
            return events
        except Exception as e:
            logger.warning("Failed to load sentra_tsunami_events.csv: %s", e)
            return []

    @lru_cache(maxsize=4)
    def load_cyclone_events(self, limit: int = 40) -> List[HistoricalEvent]:
        """Load major historical tropical cyclones from ibtracs_north_indian_ocean.csv."""
        path = self.data_dir / "ibtracs_north_indian_ocean.csv"
        if not path.exists():
            return []
        try:
            df = pd.read_csv(path, low_memory=False)
            named = df[df["NAME"].str.upper() != "UNNAMED"].copy()
            named["WMO_WIND_num"] = pd.to_numeric(named["WMO_WIND"], errors="coerce")
            named["SEASON_num"] = pd.to_numeric(named["SEASON"], errors="coerce")
            named["WMO_PRES_num"] = pd.to_numeric(named["WMO_PRES"], errors="coerce")

            # Filter for severe cyclonic storms (>= 48 knots)
            severe = named[named["WMO_WIND_num"] >= 48.0].copy()
            grouped = severe.groupby(["SEASON_num", "NAME"]).agg({
                "WMO_WIND_num": "max",
                "WMO_PRES_num": "min",
                "ISO_TIME": "first",
                "LAT": "mean",
                "LON": "mean",
                "SUBBASIN": "first",
            }).reset_index().sort_values(by="SEASON_num", ascending=False)

            events: List[HistoricalEvent] = []
            for _, row in grouped.head(limit).iterrows():
                name = str(row["NAME"]).title()
                season = int(row["SEASON_num"])
                wind_kts = float(row["WMO_WIND_num"])
                wind_kmh = round(wind_kts * 1.852, 1)
                subbasin = str(row.get("SUBBASIN", "BB"))
                basin_name = "Arabian Sea" if subbasin == "AS" else "Bay of Bengal"
                date_str = str(row.get("ISO_TIME", f"{season}-05-15"))[:10]
                pres = row.get("WMO_PRES_num")
                pres_str = f", Central Pressure: {pres:.0f} hPa" if pd.notna(pres) else ""

                severity = "CRITICAL" if wind_kmh >= 165.0 else ("HIGH" if wind_kmh >= 115.0 else "MODERATE")

                events.append(
                    HistoricalEvent(
                        event_id=f"CY-IBTRACS-{season}-{name.upper()}",
                        event_name=f"Cyclone {name} ({season}) - {basin_name}",
                        event_year=season,
                        hazard_type=HazardType.CYCLONE,
                        state_code="OD" if basin_name == "Bay of Bengal" else "GJ",
                        state_name=f"{basin_name} Coastal Littoral",
                        district_name=f"{basin_name} Basin",
                        start_date=date_str,
                        severity=severity,
                        peak_metric_name="Sustained Maximum Wind Speed",
                        peak_metric_value=wind_kmh,
                        peak_metric_unit="km/h",
                        estimated_exposed_population=0,
                        reported_fatalities=0,
                        economic_loss_inr_cr=0.0,
                        description=f"Category tropical cyclone with peak 3-minute sustained winds of {wind_kmh} km/h ({wind_kts:.0f} kts){pres_str}.",
                        data_source="NOAA IBTrACS North Indian Ocean Cyclone Database",
                    )
                )
            return events
        except Exception as e:
            logger.warning("Failed to load ibtracs_north_indian_ocean.csv: %s", e)
            return []


# Global singleton loader
hazard_data_pack_loader = HazardDataPackLoader()
