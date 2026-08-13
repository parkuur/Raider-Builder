<script lang="ts">
  import type { IconKey } from "../../model/icon-keys";
  import GuitarIcon from "phosphor-svelte/lib/GuitarIcon";
  import HardHatIcon from "phosphor-svelte/lib/HardHatIcon";
  import CellTowerIcon from "phosphor-svelte/lib/CellTowerIcon";
  import ClockClockwiseIcon from "phosphor-svelte/lib/ClockClockwiseIcon";
  import HeadphonesIcon from "phosphor-svelte/lib/HeadphonesIcon";
  import ChalkboardSimpleIcon from "phosphor-svelte/lib/ChalkboardSimpleIcon";
  import PlugIcon from "phosphor-svelte/lib/PlugIcon";
  import LightbulbIcon from "phosphor-svelte/lib/LightbulbIcon";
  import SpeakerHifiIcon from "phosphor-svelte/lib/SpeakerHifiIcon";
  import CarProfileIcon from "phosphor-svelte/lib/CarProfileIcon";
  import UsersThreeIcon from "phosphor-svelte/lib/UsersThreeIcon";
  import TentIcon from "phosphor-svelte/lib/TentIcon";
  import LockIcon from "phosphor-svelte/lib/LockIcon";
  import HairDryerIcon from "phosphor-svelte/lib/HairDryerIcon";
  import FadersIcon from "phosphor-svelte/lib/FadersIcon";
  import CircleIcon from "phosphor-svelte/lib/CircleIcon";

  const ICON_COMPONENTS: Record<IconKey, typeof GuitarIcon> = {
    guitar: GuitarIcon,
    "hard-hat": HardHatIcon,
    "cell-tower": CellTowerIcon,
    "clock-clockwise": ClockClockwiseIcon,
    headphones: HeadphonesIcon,
    "chalkboard-simple": ChalkboardSimpleIcon,
    plug: PlugIcon,
    lightbulb: LightbulbIcon,
    "speaker-hifi": SpeakerHifiIcon,
    "car-profile": CarProfileIcon,
    "users-three": UsersThreeIcon,
    tent: TentIcon,
    lock: LockIcon,
    "hair-dryer": HairDryerIcon,
    faders: FadersIcon,
    circle: CircleIcon,
  };

  let { key, size = 18 }: { key: IconKey; size?: number } = $props();

  const IconComponent = $derived(ICON_COMPONENTS[key]);
</script>

<IconComponent class="icon-glyph" data-icon={key} {size} weight="regular" />
