/** @jsxImportSource react */
import {
  AlertTriangle,
  ArrowDown,
  Camera,
  MessageCircle,
} from "lucide-react-native";
import { View } from "react-native";

import { C } from "@/premium/theme";
import { Badge, Button, Card, Divider, go, Row, Txt } from "@/premium/ui";
import { ResultView } from "@/premium/views";

/** Mismatch — explain precisely what didn't match, then the fix. */
export default function Mismatch() {
  const Line = ({ k, a, b }: { k: string; a: string; b: string }) => {
    const same = a === b;
    return (
      <View style={{ gap: 8, paddingVertical: 12 }}>
        <Txt v="micro">{k}</Txt>
        <Row between>
          <Txt v="small">On your profile</Txt>
          <Txt v="bodyStrong">{a}</Txt>
        </Row>
        <Row between>
          <Txt v="small">On your document</Txt>
          <Row gap={8}>
            <Badge
              label={same ? "Match" : "Differs"}
              tone={same ? "green" : "amber"}
            />
            <Txt v="bodyStrong" color={same ? C.ink : C.amberInk}>
              {b}
            </Txt>
          </Row>
        </Row>
      </View>
    );
  };
  return (
    <ResultView
      icon={AlertTriangle}
      tone="amber"
      over="Needs your attention"
      title="Details don't"
      accent="match."
      sub="Your passport doesn't match your profile exactly. This usually takes a minute to fix."
      primary={
        <Button
          label="Retake photo"
          icon={Camera}
          onPress={go("/document/scan")}
        />
      }
      secondary={
        <Button
          label="Talk to support"
          tone="ghost"
          icon={MessageCircle}
          onPress={go("/help")}
        />
      }
    >
      <Card pad={0} style={{ paddingHorizontal: 18, paddingVertical: 4 }}>
        <Line k="Name" a="Pradeep Mali" b="Pradeep K. Mali" />
        <Divider />
        <Line k="Date of birth" a="14 Aug 1994" b="14 Aug 1994" />
      </Card>
      <Row gap={8} style={{ justifyContent: "center" }}>
        <ArrowDown size={14} color={C.ink3} />
        <Txt v="small">Or update your profile name to match your passport</Txt>
      </Row>
    </ResultView>
  );
}
