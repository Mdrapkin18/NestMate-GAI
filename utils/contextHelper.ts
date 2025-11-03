import { AnyEntry, Baby, Feed, Sleep } from '../types';
import { getAge } from './helpers';

export const generateBabyContext = (baby: Baby, entries: AnyEntry[]): string => {
    if (!baby) return "No baby profile available.";

    const formatTime = (date: Date) => date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });

    // Separate and sort entries
    const feeds = entries.filter(e => 'kind' in e).sort((a, b) => b.startedAt.getTime() - a.startedAt.getTime()) as Feed[];
    const sleeps = entries.filter(e => 'category' in e).sort((a, b) => b.startedAt.getTime() - a.startedAt.getTime()) as Sleep[];

    let context = `Current context for baby "${baby.name}":\n`;
    context += `- Age: ${getAge(baby.dob.toISOString())}\n`;
    if (baby.weightKg) context += `- Last recorded weight: ${baby.weightKg} kg\n`;

    // Last Feed Info
    if (feeds.length > 0) {
        const lastFeed = feeds[0];
        let feedDetails = `Last feed was at ${formatTime(lastFeed.startedAt)}`;
        if (lastFeed.kind === 'bottle' && lastFeed.amountOz) {
            feedDetails += ` (${lastFeed.amountOz.toFixed(1)} oz bottle).`;
        } else if (lastFeed.kind === 'nursing' && lastFeed.side) {
            feedDetails += ` (nursing on ${lastFeed.side} side).`;
        }
        if (lastFeed.endedAt) {
            const duration = Math.round((lastFeed.endedAt.getTime() - lastFeed.startedAt.getTime()) / (1000 * 60));
            feedDetails += ` and lasted ${duration} minutes.`;
        }
        context += `- ${feedDetails}\n`;
    } else {
        context += "- No feeding entries recorded yet.\n";
    }

    // Last Sleep Info
    if (sleeps.length > 0) {
        const lastSleep = sleeps[0];
        let sleepDetails = `Last sleep started at ${formatTime(lastSleep.startedAt)}`;
        if (lastSleep.endedAt) {
            const duration = Math.round((lastSleep.endedAt.getTime() - lastSleep.startedAt.getTime()) / (1000 * 60));
            sleepDetails += ` and lasted for ${duration} minutes.`;
        } else {
             sleepDetails += " and is ongoing.";
        }
        context += `- ${sleepDetails}\n`;
    } else {
        context += "- No sleep entries recorded yet.\n";
    }

    // Recent Feed Times
    if (feeds.length > 1) {
        const recentFeeds = feeds.slice(0, 3).map(f => formatTime(f.startedAt)).join(', ');
        context += `- Recent feed times: ${recentFeeds}\n`;
    }

    // Recent Sleep Times
    if (sleeps.length > 1) {
        const recentSleeps = sleeps.slice(0, 3).map(s => formatTime(s.startedAt)).join(', ');
        context += `- Recent sleep start times: ${recentSleeps}\n`;
    }

    return context;
};
