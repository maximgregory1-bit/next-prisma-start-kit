"use client";

import * as React from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { useCustomerEdit } from "@/features/customer/hooks/use-customer-edit";
import { useCustomerRelations } from "@/features/customer/hooks/use-customer-relations";
import {
    createCustomerAgent,
    createCustomerCampaign,
    deleteCustomerAgent,
    deleteCustomerCampaign,
    updateCustomerAgent,
    updateCustomerCampaign,
    type CustomerAgent,
    type CustomerAgentPayload,
    type CustomerCampaign,
    type CustomerCampaignPayload,
} from "@/features/customer/api/customer-api";
import { Loader2, Pencil, Trash2 } from "lucide-react";

type CustomerEditPageParams = {
    customerId: string;
    initialEditable?: boolean;
};

type CustomerCampaignRow = CustomerCampaign & { displayNo: number };

type CustomerAgentRow = CustomerAgent & { displayNo: number };

export function useCustomerEditPage({ customerId, initialEditable = false }: CustomerEditPageParams) {
    const { toast } = useToast();
    const {
        error,
        form,
        emailErrors,
        hasEmailErrors,
        isEditable,
        isLoading,
        isSaving,
        formDisabled,
        setIsEditable,
        onChange,
        onToggle,
        onSet,
        updateListItem,
        updatePhoneItem,
        addListItem,
        addPhoneItem,
        removeListItem,
        removePhoneItem,
        handleSave,
    } = useCustomerEdit({ customerId, initialEditable });
    const { campaigns, agents, isLoading: relationsLoading, error: relationsError, reload: reloadRelations } = useCustomerRelations(customerId);

    const [campaignDialogOpen, setCampaignDialogOpen] = React.useState(false);
    const [campaignMode, setCampaignMode] = React.useState<"create" | "edit">("create");
    const [campaignDraft, setCampaignDraft] = React.useState<CustomerCampaignPayload>({
        name: "",
        abbreviation: "",
        status: "Active",
    });
    const [editingCampaignId, setEditingCampaignId] = React.useState<string | null>(null);
    const [campaignToDelete, setCampaignToDelete] = React.useState<CustomerCampaign | null>(null);
    const [deletingCampaignId, setDeletingCampaignId] = React.useState<string | null>(null);

    const [agentDialogOpen, setAgentDialogOpen] = React.useState(false);
    const [agentMode, setAgentMode] = React.useState<"create" | "edit">("create");
    const [agentDraft, setAgentDraft] = React.useState<CustomerAgentPayload>({
        name: "",
        sheet: "",
        tab: "",
        status: "Active",
    });
    const [editingAgentId, setEditingAgentId] = React.useState<string | null>(null);
    const [agentToDelete, setAgentToDelete] = React.useState<CustomerAgent | null>(null);
    const [deletingAgentId, setDeletingAgentId] = React.useState<string | null>(null);

    const [savingCampaign, setSavingCampaign] = React.useState(false);
    const [savingAgent, setSavingAgent] = React.useState(false);

    const openCreateCampaign = React.useCallback(() => {
        setCampaignMode("create");
        setEditingCampaignId(null);
        setCampaignDraft({ name: "", abbreviation: "", status: "Active" });
        setCampaignDialogOpen(true);
    }, []);

    const openEditCampaign = React.useCallback((campaign: CustomerCampaign) => {
        setCampaignMode("edit");
        setEditingCampaignId(campaign.id);
        setCampaignDraft({
            name: campaign.name,
            abbreviation: campaign.abbreviation ?? "",
            status: campaign.status,
        });
        setCampaignDialogOpen(true);
    }, []);

    const openCreateAgent = React.useCallback(() => {
        setAgentMode("create");
        setEditingAgentId(null);
        setAgentDraft({ name: "", sheet: "", tab: "", status: "Active" });
        setAgentDialogOpen(true);
    }, []);

    const openEditAgent = React.useCallback((agent: CustomerAgent) => {
        setAgentMode("edit");
        setEditingAgentId(agent.id);
        setAgentDraft({
            name: agent.name,
            sheet: agent.sheet ?? "",
            tab: agent.tab ?? "",
            status: agent.status,
        });
        setAgentDialogOpen(true);
    }, []);

    const handleSaveCampaign = React.useCallback(async () => {
        if (!campaignDraft.name.trim()) {
            toast({
                title: "Campaign name required",
                description: "Provide a campaign name before saving.",
                variant: "destructive",
            });
            return;
        }

        setSavingCampaign(true);
        try {
            if (campaignMode === "create") {
                await createCustomerCampaign(customerId, campaignDraft);
                toast({
                    title: "Campaign created",
                    description: "Campaign added successfully.",
                    variant: "success",
                });
            } else if (editingCampaignId) {
                await updateCustomerCampaign(customerId, editingCampaignId, campaignDraft);
                toast({
                    title: "Campaign updated",
                    description: "Campaign updated successfully.",
                    variant: "success",
                });
            }
            setCampaignDialogOpen(false);
            reloadRelations();
        } catch (error) {
            console.error(error);
            toast({
                title: "Campaign save failed",
                description: "Unable to save campaign.",
                variant: "destructive",
            });
        } finally {
            setSavingCampaign(false);
        }
    }, [campaignDraft, campaignMode, customerId, editingCampaignId, reloadRelations, toast]);

    const handleSaveAgent = React.useCallback(async () => {
        if (!agentDraft.name.trim()) {
            toast({
                title: "Agent name required",
                description: "Provide an agent name before saving.",
                variant: "destructive",
            });
            return;
        }

        setSavingAgent(true);
        try {
            if (agentMode === "create") {
                await createCustomerAgent(customerId, agentDraft);
                toast({
                    title: "Agent created",
                    description: "Agent added successfully.",
                    variant: "success",
                });
            } else if (editingAgentId) {
                await updateCustomerAgent(customerId, editingAgentId, agentDraft);
                toast({
                    title: "Agent updated",
                    description: "Agent updated successfully.",
                    variant: "success",
                });
            }
            setAgentDialogOpen(false);
            reloadRelations();
        } catch (error) {
            console.error(error);
            toast({
                title: "Agent save failed",
                description: "Unable to save agent.",
                variant: "destructive",
            });
        } finally {
            setSavingAgent(false);
        }
    }, [agentDraft, agentMode, customerId, editingAgentId, reloadRelations, toast]);

    const handleDeleteCampaign = React.useCallback(async () => {
        if (!campaignToDelete) {
            return;
        }
        setSavingCampaign(true);
        setDeletingCampaignId(campaignToDelete.id);
        try {
            await deleteCustomerCampaign(customerId, campaignToDelete.id);
            toast({
                title: "Campaign deleted",
                description: "Campaign removed successfully.",
                variant: "success",
            });
            setCampaignToDelete(null);
            reloadRelations();
        } catch (error) {
            console.error(error);
            toast({
                title: "Delete failed",
                description: "Unable to delete campaign.",
                variant: "destructive",
            });
        } finally {
            setSavingCampaign(false);
            setDeletingCampaignId(null);
        }
    }, [campaignToDelete, customerId, reloadRelations, toast]);

    const handleDeleteAgent = React.useCallback(async () => {
        if (!agentToDelete) {
            return;
        }
        setSavingAgent(true);
        setDeletingAgentId(agentToDelete.id);
        try {
            await deleteCustomerAgent(customerId, agentToDelete.id);
            toast({
                title: "Agent deleted",
                description: "Agent removed successfully.",
                variant: "success",
            });
            setAgentToDelete(null);
            reloadRelations();
        } catch (error) {
            console.error(error);
            toast({
                title: "Delete failed",
                description: "Unable to delete agent.",
                variant: "destructive",
            });
        } finally {
            setSavingAgent(false);
            setDeletingAgentId(null);
        }
    }, [agentToDelete, customerId, reloadRelations, toast]);

    const campaignRows = React.useMemo<CustomerCampaignRow[]>(() => campaigns.map((campaign, index) => ({ ...campaign, displayNo: index + 1 })), [campaigns]);
    const agentRows = React.useMemo<CustomerAgentRow[]>(() => agents.map((agent, index) => ({ ...agent, displayNo: index + 1 })), [agents]);

    const campaignColumns = React.useMemo(
        () => [
            {
                id: "no",
                header: "No",
                sortable: true,
                sortValue: (row: CustomerCampaignRow) => row.displayNo,
                cell: (row: CustomerCampaignRow) => <span className="text-sm font-semibold text-foreground">{row.displayNo}</span>,
            },
            {
                id: "name",
                header: "Name",
                sortable: true,
                sortValue: (row: CustomerCampaignRow) => row.name,
                cell: (row: CustomerCampaignRow) => <span className="text-sm font-semibold text-foreground">{row.name}</span>,
            },
            {
                id: "abbreviation",
                header: "Abbrev",
                cell: (row: CustomerCampaignRow) => <span className="text-sm text-muted-foreground">{row.abbreviation ?? "-"}</span>,
            },
            {
                id: "status",
                header: "Status",
                sortable: true,
                sortValue: (row: CustomerCampaignRow) => row.status,
                cell: (row: CustomerCampaignRow) => (
                    <Badge className={row.status === "Active" ? "rounded-full bg-emerald-100 text-emerald-700" : "rounded-full bg-slate-200 text-slate-600"}>{row.status}</Badge>
                ),
            },
            {
                id: "createdAt",
                header: "Created",
                sortable: true,
                sortValue: (row: CustomerCampaignRow) => row.createdAt ?? "",
                cell: (row: CustomerCampaignRow) => <span className="text-sm text-muted-foreground">{row.createdAt ? new Date(row.createdAt).toLocaleDateString() : "-"}</span>,
            },
            {
                id: "actions",
                header: "Actions",
                cell: (row: CustomerCampaignRow) => (
                    <div className="flex items-center gap-2 text-muted-foreground">
                        <Button variant="ghost" size="icon" className="size-8" onClick={() => openEditCampaign(row)} disabled={savingCampaign || deletingCampaignId === row.id}>
                            <Pencil className="size-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="size-8" onClick={() => setCampaignToDelete(row)} disabled={savingCampaign}>
                            {deletingCampaignId === row.id ? <Loader2 className="size-4 animate-spin" /> : <Trash2 className="size-4" />}
                        </Button>
                    </div>
                ),
            },
        ],
        [deletingCampaignId, openEditCampaign, savingCampaign],
    );

    const agentColumns = React.useMemo(
        () => [
            {
                id: "no",
                header: "No",
                sortable: true,
                sortValue: (row: CustomerAgentRow) => row.displayNo,
                cell: (row: CustomerAgentRow) => <span className="text-sm font-semibold text-foreground">{row.displayNo}</span>,
            },
            {
                id: "name",
                header: "Name",
                sortable: true,
                sortValue: (row: CustomerAgentRow) => row.name,
                cell: (row: CustomerAgentRow) => <span className="text-sm font-semibold text-foreground">{row.name}</span>,
            },
            {
                id: "sheet",
                header: "Sheet",
                cell: (row: CustomerAgentRow) => <span className="text-sm text-muted-foreground">{row.sheet ?? "-"}</span>,
            },
            {
                id: "tab",
                header: "Tab",
                cell: (row: CustomerAgentRow) => <span className="text-sm text-muted-foreground">{row.tab ?? "-"}</span>,
            },
            {
                id: "status",
                header: "Status",
                sortable: true,
                sortValue: (row: CustomerAgentRow) => row.status,
                cell: (row: CustomerAgentRow) => (
                    <Badge className={row.status === "Active" ? "rounded-full bg-emerald-100 text-emerald-700" : "rounded-full bg-slate-200 text-slate-600"}>{row.status}</Badge>
                ),
            },
            {
                id: "createdAt",
                header: "Created",
                sortable: true,
                sortValue: (row: CustomerAgentRow) => row.createdAt ?? "",
                cell: (row: CustomerAgentRow) => <span className="text-sm text-muted-foreground">{row.createdAt ? new Date(row.createdAt).toLocaleDateString() : "-"}</span>,
            },
            {
                id: "actions",
                header: "Actions",
                cell: (row: CustomerAgentRow) => (
                    <div className="flex items-center gap-2 text-muted-foreground">
                        <Button variant="ghost" size="icon" className="size-8" onClick={() => openEditAgent(row)} disabled={savingAgent || deletingAgentId === row.id}>
                            <Pencil className="size-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="size-8" onClick={() => setAgentToDelete(row)} disabled={savingAgent}>
                            {deletingAgentId === row.id ? <Loader2 className="size-4 animate-spin" /> : <Trash2 className="size-4" />}
                        </Button>
                    </div>
                ),
            },
        ],
        [deletingAgentId, openEditAgent, savingAgent],
    );

    return {
        error,
        form,
        emailErrors,
        hasEmailErrors,
        isEditable,
        isLoading,
        isSaving,
        formDisabled,
        setIsEditable,
        onChange,
        onToggle,
        onSet,
        updateListItem,
        updatePhoneItem,
        addListItem,
        addPhoneItem,
        removeListItem,
        removePhoneItem,
        handleSave,
        campaigns,
        agents,
        relationsLoading,
        relationsError,
        campaignDialogOpen,
        setCampaignDialogOpen,
        campaignMode,
        campaignDraft,
        setCampaignDraft,
        openCreateCampaign,
        openEditCampaign,
        handleSaveCampaign,
        campaignToDelete,
        setCampaignToDelete,
        handleDeleteCampaign,
        deletingCampaignId,
        agentDialogOpen,
        setAgentDialogOpen,
        agentMode,
        agentDraft,
        setAgentDraft,
        openCreateAgent,
        openEditAgent,
        handleSaveAgent,
        agentToDelete,
        setAgentToDelete,
        handleDeleteAgent,
        deletingAgentId,
        savingCampaign,
        savingAgent,
        campaignRows,
        agentRows,
        campaignColumns,
        agentColumns,
    };
}
