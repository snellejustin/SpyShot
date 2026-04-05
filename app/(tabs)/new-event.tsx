// Dummy screen — never shown. The tab button intercepts navigation
// and opens the create-group flow instead.
import { Redirect } from 'expo-router';

export default function NewEventPlaceholder() {
    return <Redirect href="/(tabs)/(index)" />;
}
