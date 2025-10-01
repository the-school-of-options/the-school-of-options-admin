import React from "react";
import { BasePropertyProps, RecordJSON } from "adminjs";
import { Box, Label, Button } from "@adminjs/design-system";

// Simple RichText editor for AdminJS using design-system's RichText
// Works for both edit and show views.

const getValue = (record: RecordJSON | undefined, path: string): string => {
  return (record?.params?.[path] as unknown as string) || "";
};

const Editor: React.FC<BasePropertyProps> = (props) => {
  const { property, record, onChange } = props;
  const value = getValue(record, property.path);

  return (
    <Box>
      <Label required={Boolean(property.isRequired)}>{property.label}</Label>
      <Box marginBottom="sm" display="flex" gap="sm">
        <Button size="sm" onClick={() => document.execCommand("bold")}>B</Button>
        <Button size="sm" onClick={() => document.execCommand("italic")}>I</Button>
        <Button size="sm" onClick={() => document.execCommand("underline")}>
          U
        </Button>
        <Button size="sm" onClick={() => document.execCommand("insertUnorderedList")}>
          • List
        </Button>
        <Button size="sm" onClick={() => document.execCommand("formatBlock", false, "h3")}>
          H3
        </Button>
      </Box>
      <div
        id={property.path}
        contentEditable
        style={{
          minHeight: 180,
          border: "1px solid #e5e7eb",
          borderRadius: 6,
          padding: 12,
          background: "#fff",
        }}
        onInput={(e) => {
          const html = (e.currentTarget as HTMLDivElement).innerHTML;
          onChange?.(property.path, html || "");
        }}
        dangerouslySetInnerHTML={{ __html: value }}
      />
    </Box>
  );
};

export const Show: React.FC<BasePropertyProps> = ({ property, record }) => {
  const value = getValue(record, property.path);
  return (
    <Box>
      <Label>{property.label}</Label>
      <Box
        variant="white"
        style={{ padding: 12, borderRadius: 6, border: "1px solid #eee" }}
      >
        {/* eslint-disable-next-line react/no-danger */}
        <div dangerouslySetInnerHTML={{ __html: value }} />
      </Box>
    </Box>
  );
};

export default Editor;
