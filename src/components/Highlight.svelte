<script lang="ts">
import { highlightText } from "@lib/highlight";
export let text = "";
export let query = "";
</script>

<span>{@html highlightText(text, query)}</span>
