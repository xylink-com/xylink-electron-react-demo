import { Button } from "antd";
import { ButtonProps } from "antd/lib/button";
import style from "./index.module.scss";
import cn from "classnames";

type IProps = ButtonProps & {
  bType?: "DEFAULT" | "PRIMARY" | "DANGER" | "CANCEL";
};

const IndexView = (props: IProps) => {
  const { bType,children, className,  ...rest } = props;

  let cls: string = style.defaultBtn;
  switch (bType) {
    case "DEFAULT":
      cls = style.defaultBtn;
      break;
    case "PRIMARY":
      cls = style.primaryBtn;
      break;
    case "DANGER":
      cls = style.dangerBtn;
      break;
    case "CANCEL":
      cls = style.cancelBtn;
      break;
  }

  return (
    <Button
      {...rest}
      className={cn(style.button, cls, className)}
    >
      {children}
    </Button>
  );

}

export default IndexView;
