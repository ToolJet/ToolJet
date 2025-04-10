import React from "react";
import OriginalAdmonition from "@theme-original/Admonition";
import NoteIcon from "@site/static/img/alert-box/information.svg";
import TipIcon from "@site/static/img/alert-box/idea.svg";
import DangerIcon from "@site/static/img/alert-box/danger.svg";
import CautionIcon from "@site/static/img/alert-box/warning.svg";

const iconMap = {
    note: NoteIcon,
    tip: TipIcon,
    danger: DangerIcon,
    info: NoteIcon,
    caution: CautionIcon,
    warning: CautionIcon
};

export default function Admonition(props) {
    const { type = "info" } = props; // Default to "info" if type is not provided
    const Icon = iconMap[type] || NoteIcon; // Fallback to NoteIcon if type is unrecognized

    return (
        <OriginalAdmonition
            {...props}
            icon={<Icon />}
        />
    );
}