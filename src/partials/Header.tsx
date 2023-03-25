import {
  createStyles,
  Header,
  Group,
  Button,
  Box,
  Text,
  useMantineColorScheme,
  Flex,
} from "@mantine/core";
import { IconBrandGithub, IconMoon, IconSun } from "@tabler/icons-react";
import TemplateSelect from "./TemplateSelect";

const useStyles = createStyles((theme) => ({
  text: {
    color: theme.colorScheme === "dark" ? theme.colors.dark[0] : theme.black,
    fontWeight: 500,
  },

  hiddenMobile: {
    [theme.fn.smallerThan("sm")]: {
      display: "none",
    },
  },

  hiddenDesktop: {
    [theme.fn.largerThan("sm")]: {
      display: "none",
    },
  },
}));

export default function FullHeader() {
  const { colorScheme, toggleColorScheme } = useMantineColorScheme();
  const { classes } = useStyles();

  return (
    <Box>
      <Header height={60} px="md">
        <Group position="apart" sx={{ height: "100%" }}>
          <Text className={classes.text}>LLaMA Playground</Text>

          <Group position="center" className={classes.hiddenMobile}>
            <TemplateSelect />
          </Group>

          <Group>
            <Button
              px={6}
              variant={"light"}
              onClick={() =>
                window.open(
                  "https://github.com/ItzDerock/llama-playground",
                  "_blank"
                )
              }
            >
              <IconBrandGithub />
            </Button>

            <Button
              px={6}
              onClick={() => toggleColorScheme()}
              variant={colorScheme === "dark" ? "white" : "filled"}
              color={colorScheme === "dark" ? "blue" : "dark"}
            >
              {colorScheme === "dark" ? <IconSun /> : <IconMoon />}
            </Button>
          </Group>
        </Group>
      </Header>

      <Flex
        h={60}
        px="md"
        className={classes.hiddenDesktop}
        justify="stretch"
        align="center"
      >
        <TemplateSelect fullWidth />
      </Flex>
    </Box>
  );
}
