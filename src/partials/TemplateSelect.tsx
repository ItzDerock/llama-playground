import { Button, Flex, Modal, Select, TextInput } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { useForm } from "@mantine/form";
import { useEffect } from "react";
import { useRecoilState, useRecoilValue } from "recoil";
import {
  generatingState,
  maxPredictionTokensState,
  promptState,
  promptTemplateState,
  repeatLastNState,
  repeatPenaltyState,
  tempState,
  topKState,
  topPState,
} from "~/recoil/states";
import {
  allTemplatesState,
  defaultTemplates,
  TemplateData,
} from "~/recoil/templates";

function setIfExists<T>(setFunction: (arg0: T) => void, value?: T) {
  if (value !== undefined) setFunction(value);
}

export default function TemplateSelect({ fullWidth }: { fullWidth?: boolean }) {
  const [templates, setTemplates] = useRecoilState(allTemplatesState);

  // the model options
  const [maxTokens, setMaxTokens] = useRecoilState(maxPredictionTokensState);
  const [topK, setTopK] = useRecoilState(topKState);
  const [topP, setTopP] = useRecoilState(topPState);
  const [repeatPenalty, setRepeatPenalty] = useRecoilState(repeatPenaltyState);
  const [repeatLastN, setRepeatLastN] = useRecoilState(repeatLastNState);
  const [temp, setTemp] = useRecoilState(tempState);
  const [prompt, _setPrompt] = useRecoilState(promptState);
  const [_, setTemplatePrompt] = useRecoilState(promptTemplateState);

  // generation state
  const generating = useRecoilValue(generatingState);

  // modal state
  const [opened, { open, close }] = useDisclosure(false);
  const form = useForm({
    initialValues: {
      name: "",
    },

    validate: {
      name: (value) => {
        if (!value) return "Name is required";
        if (defaultTemplates.some((template) => template.name === value))
          return "Cannot override default templates.";
      },
    },
  });

  // read templates from local storage
  useEffect(() => {
    const storedTemplates = localStorage.getItem("templates");
    if (storedTemplates) {
      try {
        setTemplates((defaultTemplates) => [
          ...defaultTemplates,
          ...JSON.parse(storedTemplates ?? "[]"),
        ]);
      } catch (error) {
        console.error(`Error parsing templates:`, error);
      }
    }
  }, []);

  // save templates to local storage
  useEffect(() => {
    // only save if they are not the default templates
    const userCreatedTemplates = templates.filter(
      (template) => !defaultTemplates.some((tmp) => tmp.name === template.name)
    );

    localStorage.setItem("templates", JSON.stringify(userCreatedTemplates));
  }, [templates]);

  // save
  function saveTemplate(name: string) {
    const templateData = {
      name,
      prompt,
      options: {
        maximum_tokens: maxTokens,
        repeat_last_n: repeatLastN,
        temperature: temp,
        repeat_penalty: repeatPenalty,
        top_p: topP,
        top_k: topK,
      },
    } satisfies TemplateData;

    setTemplates((templates) => [...templates, templateData]);
    close();
  }

  // load
  function loadTemplate(name: string) {
    const template = templates.find((template) => template.name === name);
    if (!template) return;

    setTemplatePrompt(template.prompt);
    setIfExists(setMaxTokens, template.options?.maximum_tokens);
    setIfExists(setTopK, template.options?.top_k);
    setIfExists(setTopP, template.options?.top_p);
    setIfExists(setRepeatPenalty, template.options?.repeat_penalty);
    setIfExists(setRepeatLastN, template.options?.repeat_last_n);
    setIfExists(setTemp, template.options?.temperature);
  }

  return (
    <>
      {/* modal */}
      <Modal opened={opened} onClose={close} title="Save as Template">
        <form onSubmit={form.onSubmit((data) => saveTemplate(data.name))}>
          <TextInput
            label="Name"
            placeholder="Template name..."
            required
            {...form.getInputProps("name")}
          />
          <Button type="submit" variant="outline" color="teal" mt="md">
            Save
          </Button>
        </form>
      </Modal>

      <Flex
        gap="md"
        direction="row"
        wrap="wrap"
        align={fullWidth ? "stretch" : "center"}
        sx={{
          flexGrow: fullWidth ? 1 : 0,
        }}
      >
        <Select
          data={templates.map((template) => template.name)}
          placeholder="Select a template..."
          searchable
          clearable
          creatable
          getCreateLabel={(value) => `+ Save as ${value}`}
          onCreate={(value) => {
            form.setFieldValue("name", value);
            open();
            return value;
          }}
          onSelect={(value) => {
            loadTemplate(value.currentTarget.value);
            return value;
          }}
          sx={{ flexGrow: fullWidth ? 1 : 0 }}
          disabled={generating}
        />

        <Button
          variant="outline"
          color="teal"
          onClick={open}
          disabled={generating}
        >
          Save
        </Button>
      </Flex>
    </>
  );
}
