import { RichTextEditor } from "@mantine/tiptap";
import { useEditor, type Content } from "@tiptap/react";
import { useEffect } from "react";
import { useRecoilState } from "recoil";
import {
  generatedText,
  generatingState,
  promptState,
  promptTemplateState,
} from "~/recoil/states";
import Document from "@tiptap/extension-document";
import Text from "@tiptap/extension-text";
import Paragraph from "@tiptap/extension-paragraph";
import Placeholder from "@tiptap/extension-placeholder";
import Highlight from "@tiptap/extension-highlight";

export default function PromptEditor() {
  const [_prompt, setPrompt] = useRecoilState(promptState);
  const [generating] = useRecoilState(generatingState);
  const [generated] = useRecoilState(generatedText);
  const [templatePrompt, __] = useRecoilState(promptTemplateState);

  // build a tiptap editor
  const editor = useEditor({
    extensions: [
      Document,
      Paragraph,
      Text,
      Placeholder.configure({
        placeholder: "Q: What is a llama?",
      }),
      Highlight,
    ],
    onUpdate: ({ editor }) => {
      setPrompt(
        editor.getText({
          blockSeparator: "\n",
        })
      );
    },
  });

  // handle enabling/disabling the editor
  useEffect(() => {
    if (generating) {
      editor?.setEditable(false);
      editor?.chain().focus("end").setHighlight({ color: "#FFF68F" }).run();
    } else {
      editor?.commands.unsetHighlight();
      editor?.setEditable(true);
    }
  }, [generating]);

  // handle updating the generated text
  useEffect(() => {
    if (!editor) return;

    editor
      .chain()
      .focus("end")
      .setHighlight({ color: "#FFF68F" })
      .insertContent(
        generated === "\n"
          ? {
              type: "paragraph",
              content: [],
            }
          : generated
      )
      .run();
  }, [generated]);

  // handle prompt changes
  useEffect(() => {
    if (!editor) return;

    // delete all content and insert the new prompt
    editor
      .chain()
      .selectAll()
      .deleteSelection()
      .insertContent(templatePrompt)
      .run();
  }, [templatePrompt]);

  return (
    <RichTextEditor
      editor={editor}
      sx={{
        flexGrow: 1,
        "& p": {
          margin: 0,
          marginBottom: "0 !important",
        },
      }}
    >
      <RichTextEditor.Content />
    </RichTextEditor>
  );
}
