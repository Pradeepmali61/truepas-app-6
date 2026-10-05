/** @jsxImportSource react */
/**
 * Help & FAQ — static content screen; entry points: liveness failure
 * "Get help", history "How check-in works", and the About page.
 *
 * Search and topic chips filter the FAQ locally (no backend needed).
 * Contact options come from GET /support/channels: only the channels the
 * server sets are shown (email → mailto:, phone → tel:, chat → its link,
 * hours as text). The email falls back to the default address only while
 * that call loads or fails.
 */
import { ChevronDown, ChevronRight, CircleHelp, Clock, Headset, Mail, MessageCircle, Phone, Search, X } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, TextInput, View, type TextStyle } from 'react-native';

import { callSupport, emailSupport, openSupportChat, useSupportContact } from '@/premium/flows/account';
import { EmptyView } from '@/premium/kit';
import { C, F, R } from '@/premium/theme';
import { Button, Card, Chip, Divider, Heading, Row, Screen, Tile, TopBar, Txt } from '@/premium/ui';

type Topic = 'checkin' | 'privacy' | 'family' | 'documents';

const TOPICS: { value: Topic; label: string }[] = [
  { value: 'checkin', label: 'Check-in' },
  { value: 'privacy', label: 'Face & privacy' },
  { value: 'family', label: 'Family' },
  { value: 'documents', label: 'Documents' },
];

const FAQS: { value: string; topic: Topic; title: string; content: string }[] = [
  {
    value: 'checkin',
    topic: 'checkin',
    title: 'How does face check-in work?',
    content:
      'At a participating venue, open Truepas and glance at the kiosk camera. Your enrolled face proves your identity — no documents needed. Every check-in appears in your History tab.',
  },
  {
    value: 'biometric',
    topic: 'privacy',
    title: 'Is my biometric data shared?',
    content:
      'Your face template is used only to verify your identity. Check-in consent is separate from biometric consent, and you can withdraw either at any time from Settings → Privacy.',
  },
  {
    value: 'doc-fail',
    topic: 'documents',
    title: 'Why did my document verification fail?',
    content:
      'Most failures are image quality — glare, blur, or the document not filling the frame. Recapture in good light on a flat, dark surface and try again.',
  },
  {
    value: 'family',
    topic: 'family',
    title: 'How are family members verified?',
    content:
      'Members under 5 need an identity document plus a clear photo. Members 5 and older need a document plus a short liveness check in the app.',
  },
  {
    value: 'update-face',
    topic: 'privacy',
    title: 'How do I update my face?',
    content:
      "Go to Security → Update face. Enter your PIN, then repeat a quick liveness check so we can be sure it's really you before replacing the enrolled face.",
  },
];

export default function HelpScreen() {
  const [query, setQuery] = useState('');
  const [topic, setTopic] = useState<Topic | null>(null);
  // Multiple panels may be open at once (legacy Accordion `multiple`).
  const [open, setOpen] = useState<Set<string>>(() => new Set());
  const support = useSupportContact();
  const hasContact = !!(support.email || support.phone || support.chatUrl);

  const q = query.trim().toLowerCase();
  const items = FAQS.filter(
    (f) =>
      (topic == null || f.topic === topic) &&
      (q === '' || f.title.toLowerCase().includes(q) || f.content.toLowerCase().includes(q)),
  );

  const toggle = (value: string) =>
    setOpen((prev) => {
      const next = new Set(prev);
      if (next.has(value)) next.delete(value);
      else next.add(value);
      return next;
    });

  return (
    <Screen keyboard header={<TopBar title="Help & FAQ" />} contentStyle={{ paddingTop: 4 }}>
      <Heading title="How can we" accent="help?" />

      <View style={{ gap: 14 }}>
        <View
          style={{
            height: 54,
            borderRadius: R.full,
            backgroundColor: C.surface,
            borderWidth: 1,
            borderColor: C.line,
            flexDirection: 'row',
            alignItems: 'center',
            paddingHorizontal: 18,
            gap: 12,
          }}>
          <Search size={19} color={C.ink3} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Search questions"
            placeholderTextColor={C.ink4}
            accessibilityLabel="Search questions"
            returnKeyType="search"
            autoCorrect={false}
            style={{ flex: 1, fontFamily: F.medium, fontSize: 15, color: C.ink, outlineStyle: 'none' } as unknown as TextStyle}
          />
          {query.length > 0 && (
            <Pressable onPress={() => setQuery('')} hitSlop={10} accessibilityRole="button" accessibilityLabel="Clear search">
              <X size={17} color={C.ink3} />
            </Pressable>
          )}
        </View>
        <Row gap={8} style={{ flexWrap: 'wrap' }}>
          {TOPICS.map((t) => (
            <Chip
              key={t.value}
              label={t.label}
              active={topic === t.value}
              onPress={() => setTopic(topic === t.value ? null : t.value)}
            />
          ))}
        </Row>
      </View>

      {items.length === 0 ? (
        <Card>
          <EmptyView compact icon={CircleHelp} title="No matching questions" body="Try another word, or email our support team below." />
        </Card>
      ) : (
        <Card pad={0} style={{ paddingHorizontal: 18 }}>
          {items.map((f, i) => {
            const isOpen = open.has(f.value);
            return (
              <View key={f.value}>
                {i > 0 && <Divider />}
                <Pressable
                  onPress={() => toggle(f.value)}
                  accessibilityRole="button"
                  accessibilityState={{ expanded: isOpen }}>
                  <View style={{ paddingVertical: 16, gap: 10 }}>
                    <Row between>
                      <Txt v="bodyStrong" style={{ flex: 1 }}>
                        {f.title}
                      </Txt>
                      {isOpen ? <ChevronDown size={18} color={C.ink} /> : <ChevronRight size={18} color={C.ink4} />}
                    </Row>
                    {isOpen && (
                      <Txt v="body" style={{ lineHeight: 23 }}>
                        {f.content}
                      </Txt>
                    )}
                  </View>
                </Pressable>
              </View>
            );
          })}
        </Card>
      )}

      {hasContact && (
        <Card style={{ gap: 14 }}>
          <Row gap={14}>
            <Tile icon={Headset} tone="sky" size={42} />
            <View style={{ flex: 1, gap: 2 }}>
              <Txt v="bodyStrong">Still stuck?</Txt>
              <Txt v="small">Our support team can help with verification issues.</Txt>
            </View>
          </Row>
          {!!support.hours && (
            <Row gap={8}>
              <Clock size={14} color={C.ink3} />
              <Txt v="small" style={{ flex: 1 }}>
                {support.hours}
              </Txt>
            </Row>
          )}
          {!!support.email && (
            <Button label="Email us" tone="white" size="md" icon={Mail} onPress={() => emailSupport(support.email ?? undefined)} />
          )}
          {!!support.phone && (
            <Button label="Call us" tone="white" size="md" icon={Phone} onPress={() => callSupport(support.phone as string)} />
          )}
          {!!support.chatUrl && (
            <Button
              label="Chat with us"
              tone="white"
              size="md"
              icon={MessageCircle}
              onPress={() => openSupportChat(support.chatUrl as string)}
            />
          )}
        </Card>
      )}
    </Screen>
  );
}
