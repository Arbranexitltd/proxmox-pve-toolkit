"""
Proxmox PVE Toolkit - Primary CLI Entrypoint.
Built with Typer and Rich for beautiful DevOps terminal workflows.

MIT License
Copyright (c) 2026 Principal Infrastructure & DevOps
"""

import json
import logging
import sys
from typing import Optional
import typer
from rich import print as rprint
from rich.console import Console
from rich.panel import Panel
from rich.progress import Progress, SpinnerColumn, TextColumn
from rich.table import Table
from rich.syntax import Syntax

from proxmox_pve_toolkit import __version__
from proxmox_pve_toolkit.config import load_config
from proxmox_pve_toolkit.pve_client import PVEClient
from proxmox_pve_toolkit.auditor import NodeAuditor
from proxmox_pve_toolkit.backup import BackupOrchestrator, BackupJobConfig
from proxmox_pve_toolkit.power import PowerController
from proxmox_pve_toolkit.security import SecurityAuditor

app = typer.Typer(
    name="pve-tool",
    help="Enterprise Proxmox VE 7.x/8.x Management, Hardening & Automation Toolkit",
    add_completion=True,
    rich_markup_mode="rich",
)

node_app = typer.Typer(help="Node health, metrics, and storage pool auditing")
backup_app = typer.Typer(help="Automated vzdump and snapshot lifecycle orchestration")
power_app = typer.Typer(help="Bulk VM/LXC power transitions with tag & pool filters")
security_app = typer.Typer(help="Security baseline compliance, 2FA, and firewall hardening")

app.add_typer(node_app, name="node")
app.add_typer(backup_app, name="backup")
app.add_typer(power_app, name="power")
app.add_typer(security_app, name="security")

console = Console()


def get_client(config_path: Optional[str] = None) -> PVEClient:
    """Initialize Proxmox API client from config."""
    try:
        config = load_config(config_path)
        client = PVEClient(config)
        return client
    except Exception as e:
        console.print(f"[bold red]Configuration / Connection Error:[/bold red] {e}")
        raise typer.Exit(code=1)


# ==============================================================================
# CLI: Global Commands
# ==============================================================================

@app.command("version")
def show_version():
    """Display toolkit version and author metadata."""
    console.print(
        Panel.fit(
            f"[bold cyan]Proxmox PVE Toolkit[/bold cyan] [bold green]v{__version__}[/bold green]\n"
            f"[dim]Hypervisor Automation & Security Hardening Engine[/dim]\n"
            f"Compatible with Proxmox VE 7.x and 8.x",
            border_style="cyan",
        )
    )


@app.command("config-check")
def config_check(config_path: Optional[str] = typer.Option(None, "--config", "-c", help="Path to YAML config")):
    """Verify Proxmox API connectivity and credentials."""
    with Progress(
        SpinnerColumn(),
        TextColumn("[progress.description]{task.description}"),
        console=console,
    ) as progress:
        task = progress.add_task("Connecting to Proxmox VE API...", total=None)
        client = get_client(config_path)
        api = client.connect()
        ver = api.version.get()
        nodes = client.get_nodes()
        progress.update(task, description="Connection verified!")

    console.print("[bold green]SUCCESS: Authenticated to Proxmox VE Cluster![/bold green]")
    table = Table(title="Connection Context", show_header=True, header_style="bold magenta")
    table.add_column("Parameter", style="cyan")
    table.add_column("Value", style="green")
    
    table.add_row("Proxmox Host", f"{client.config.proxmox_host}:{client.config.proxmox_port}")
    table.add_row("User / Realm", client.config.proxmox_user)
    table.add_row("Auth Type", "API Token" if client.config.proxmox_token_name else "Password")
    table.add_row("SSL Verification", str(client.config.verify_ssl))
    table.add_row("PVE Version", f"{ver.get('version', '')}-{ver.get('release', '')}")
    table.add_row("Cluster Nodes", ", ".join(n["node"] for n in nodes))
    console.print(table)


# ==============================================================================
# CLI: Node Health & Metrics
# ==============================================================================

@node_app.command("health")
def audit_node(
    node: Optional[str] = typer.Option(None, "--node", "-n", help="Target node name"),
    config: Optional[str] = typer.Option(None, "--config", "-c", help="Config file path"),
    json_output: bool = typer.Option(False, "--json", help="Output raw JSON"),
):
    """Audit node CPU, RAM, I/O wait, kernel, and storage pools."""
    client = get_client(config)
    auditor = NodeAuditor(client)
    report = auditor.audit_node(node)

    if json_output:
        rprint(report.model_dump_json(indent=2))
        return

    # Render Node Summary Card
    console.print(
        Panel(
            f"[bold white]Node:[/bold white] [bold cyan]{report.node}[/bold cyan]  |  "
            f"[bold white]Status:[/bold white] [green]{report.status.upper()}[/green]  |  "
            f"[bold white]Uptime:[/bold white] {report.uptime_days} days\n"
            f"[bold white]PVE Version:[/bold white] {report.pve_version}  |  "
            f"[bold white]Kernel:[/bold white] [dim]{report.kernel_version}[/dim]\n"
            f"[bold white]Workloads:[/bold white] {report.running_guests} running "
            f"({report.qemu_count} VMs, {report.lxc_count} LXCs)",
            title=f"Proxmox Node Telemetry: {report.node}",
            border_style="blue",
        )
    )

    # Render Compute Metrics Table
    comp_table = Table(title="Compute & Memory Telemetry", show_header=True, header_style="bold blue")
    comp_table.add_column("Resource", style="cyan")
    comp_table.add_column("Utilization", style="bold")
    comp_table.add_column("Details", style="dim")

    cpu_color = "red" if report.cpu_usage_pct > 80 else ("yellow" if report.cpu_usage_pct > 50 else "green")
    comp_table.add_row("CPU Load", f"[{cpu_color}]{report.cpu_usage_pct}%[/{cpu_color}]", f"{report.cpu_cores} vCPUs (Load: {report.load_avg})")
    
    iowait_color = "red" if report.cpu_iowait_pct > 10 else "green"
    comp_table.add_row("I/O Wait", f"[{iowait_color}]{report.cpu_iowait_pct}%[/{iowait_color}]", "Disk I/O latency pressure")

    mem_color = "red" if report.memory_usage_pct > 85 else ("yellow" if report.memory_usage_pct > 70 else "green")
    comp_table.add_row("RAM Memory", f"[{mem_color}]{report.memory_usage_pct}%[/{mem_color}]", f"{report.memory_used_gb} GB / {report.memory_total_gb} GB")
    comp_table.add_row("Swap", f"{report.swap_used_gb} GB / {report.swap_total_gb} GB", "Swap buffer")
    comp_table.add_row("Root Filesystem", f"{report.rootfs_usage_pct}%", "Host / root partition")
    console.print(comp_table)

    # Render Storage Pools Table
    if report.storage_pools:
        st_table = Table(title="Storage Pool Capacity & Status", show_header=True, header_style="bold cyan")
        st_table.add_column("Storage Pool", style="bold white")
        st_table.add_column("Type", style="dim")
        st_table.add_column("Usage %", justify="right")
        st_table.add_column("Used / Total", justify="right")
        st_table.add_column("Free", justify="right", style="green")
        st_table.add_column("Status", justify="center")

        for p in report.storage_pools:
            color = "red" if p.usage_pct >= 90 else ("yellow" if p.usage_pct >= 75 else "green")
            st_table.add_row(
                p.storage,
                p.type,
                f"[{color}]{p.usage_pct}%[/{color}]",
                f"{p.used_gb} GB / {p.total_gb} GB",
                f"{p.avail_gb} GB",
                "[green]ACTIVE[/green]" if p.active else "[red]INACTIVE[/red]",
            )
        console.print(st_table)

    # Alerts
    if report.alerts:
        console.print("\n[bold red]Health Alerts Detected:[/bold red]")
        for alert in report.alerts:
            console.print(f"  [red]â [/red] {alert}")
    else:
        console.print("\n[bold green]No critical bottlenecks detected on node.[/bold green]")


@node_app.command("cluster")
def audit_cluster(
    config: Optional[str] = typer.Option(None, "--config", "-c", help="Config file path"),
    json_output: bool = typer.Option(False, "--json", help="Output raw JSON"),
):
    """Audit cluster quorum, node state, and guest inventory."""
    client = get_client(config)
    auditor = NodeAuditor(client)
    report = auditor.audit_cluster()

    if json_output:
        rprint(report.model_dump_json(indent=2))
        return

    table = Table(title=f"Cluster Status: {report.cluster_name}", show_header=True, header_style="bold blue")
    table.add_column("Node Name", style="bold")
    table.add_column("Status", style="bold")
    table.add_column("CPU %", justify="right")
    table.add_column("RAM %", justify="right")
    table.add_column("IP Address", style="dim")

    for n in report.nodes_summary:
        st = n.get("status", "unknown")
        color = "green" if st == "online" else "red"
        cpu = round(n.get("cpu", 0) * 100, 1)
        mem_tot = n.get("maxmem", 1)
        mem_used = n.get("mem", 0)
        mem_pct = round((mem_used / mem_tot) * 100, 1) if mem_tot > 0 else 0
        table.add_row(
            n.get("node", "unknown"),
            f"[{color}]{st.upper()}[/{color}]",
            f"{cpu}%",
            f"{mem_pct}%",
            n.get("ip", "N/A"),
        )

    console.print(table)
    console.print(f"Total Workloads: [cyan]{report.total_vms} VMs[/cyan] | [cyan]{report.total_lxcs} LXCs[/cyan]")


# ==============================================================================
# CLI: Backup Orchestration
# ==============================================================================

@backup_app.command("run")
def run_backup(
    vmid: Optional[int] = typer.Option(None, "--vmid", "-v", help="Target specific VMID"),
    node: Optional[str] = typer.Option(None, "--node", "-n", help="Node name"),
    storage: str = typer.Option("local", "--storage", "-s", help="Target backup storage pool"),
    mode: str = typer.Option("snapshot", "--mode", "-m", help="Backup mode: snapshot, suspend, stop"),
    compress: str = typer.Option("zstd", "--compress", help="Compression: zstd, gzip, lzo, 0"),
    keep_last: int = typer.Option(3, "--keep-last", help="Retention: keep last N backups"),
    keep_daily: int = typer.Option(7, "--keep-daily", help="Retention: keep N daily backups"),
    dry_run: bool = typer.Option(False, "--dry-run", help="Simulate backup without writing data"),
    export_log: Optional[str] = typer.Option(None, "--export-log", help="Path to export JSON report"),
    config: Optional[str] = typer.Option(None, "--config", "-c", help="Config file path"),
):
    """Trigger vzdump backup with retention pruning policies."""
    client = get_client(config)
    orchestrator = BackupOrchestrator(client)

    job = BackupJobConfig(
        vmid=vmid,
        node=node,
        storage=storage,
        mode=mode,
        compress=compress,
        keep_last=keep_last,
        keep_daily=keep_daily,
        dry_run=dry_run,
    )

    console.print(f"[bold blue]Starting Backup Orchestrator[/bold blue] (mode: {mode}, compression: {compress})...")
    results = orchestrator.run_vzdump(job)

    table = Table(title="Backup Execution Summary", show_header=True, header_style="bold green")
    table.add_column("VMID", style="bold")
    table.add_column("Name", style="cyan")
    table.add_column("Type", style="dim")
    table.add_column("Storage", style="white")
    table.add_column("Status", style="bold")
    table.add_column("Duration", justify="right")

    for r in results:
        status_color = "green" if "SUCCESS" in r.status else "red"
        table.add_row(
            str(r.vmid),
            r.guest_name,
            r.guest_type.upper(),
            r.storage,
            f"[{status_color}]{r.status}[/{status_color}]",
            f"{r.duration_seconds}s",
        )

    console.print(table)

    if export_log:
        orchestrator.export_report(results, export_log)
        console.print(f"[green]Backup logs exported to: {export_log}[/green]")


@backup_app.command("snapshot")
def create_snapshot(
    vmid: int = typer.Argument(..., help="VMID to snapshot"),
    name: str = typer.Argument(..., help="Snapshot name (e.g. pre-upgrade)"),
    description: str = typer.Option("", "--desc", "-d", help="Description"),
    vmstate: bool = typer.Option(False, "--include-ram", help="Save RAM state (VMs only)"),
    node: Optional[str] = typer.Option(None, "--node", "-n", help="Node name"),
    config: Optional[str] = typer.Option(None, "--config", "-c", help="Config file path"),
):
    """Create an instant live snapshot for a VM or Container."""
    client = get_client(config)
    orchestrator = BackupOrchestrator(client)
    res = orchestrator.create_snapshot(vmid, name, description, vmstate, node)
    console.print(f"[bold green]Snapshot '{name}' successfully initiated for VMID {vmid}![/bold green]")


# ==============================================================================
# CLI: Bulk Power State Controller
# ==============================================================================

@power_app.command("execute")
def execute_power(
    action: str = typer.Argument(..., help="Action: start, shutdown, reboot, stop"),
    tag: Optional[str] = typer.Option(None, "--tag", "-t", help="Filter by guest tag (e.g. 'prod', 'k8s')"),
    pool: Optional[str] = typer.Option(None, "--pool", "-p", help="Filter by Proxmox Resource Pool ID"),
    node: Optional[str] = typer.Option(None, "--node", "-n", help="Filter by node name"),
    guest_type: Optional[str] = typer.Option(None, "--type", help="Filter by type: qemu or lxc"),
    timeout: int = typer.Option(60, "--timeout", help="Graceful shutdown timeout in seconds"),
    force: bool = typer.Option(False, "--force", help="Force stop after timeout expires"),
    dry_run: bool = typer.Option(False, "--dry-run", help="Simulate power action without executing"),
    yes: bool = typer.Option(False, "--yes", "-y", help="Skip interactive confirmation prompt"),
    config: Optional[str] = typer.Option(None, "--config", "-c", help="Config file path"),
):
    """Execute batch power operations (start/shutdown/reboot/stop) across filtered guests."""
    client = get_client(config)
    controller = PowerController(client)

    guests = controller.filter_guests(
        node=node,
        tag=tag,
        pool=pool,
        guest_type=guest_type,
    )

    if not guests:
        console.print("[yellow]No guests matched the specified filters.[/yellow]")
        return

    console.print(f"[bold]Matched [cyan]{len(guests)}[/cyan] guest(s) for action [red]{action.upper()}[/red]:[/bold]")
    for g in guests:
        console.print(f"  - VMID: {g['vmid']} | Name: {g.get('name')} | Node: {g['node']} | Status: {g.get('status')}")

    if not dry_run and not yes:
        confirm = typer.confirm(f"\nAre you sure you want to execute '{action}' on these {len(guests)} guests?")
        if not confirm:
            console.print("[yellow]Operation aborted by user.[/yellow]")
            raise typer.Abort()

    reports = controller.execute_bulk_power(
        action=action,
        guests=guests,
        timeout_seconds=timeout,
        force_after_timeout=force,
        dry_run=dry_run,
    )

    table = Table(title=f"Power Action Results ({action.upper()})", show_header=True, header_style="bold blue")
    table.add_column("VMID", style="bold")
    table.add_column("Name", style="cyan")
    table.add_column("Node", style="dim")
    table.add_column("Initial Status")
    table.add_column("Success", justify="center")
    table.add_column("Message", style="white")

    for r in reports:
        sc = "[green]YES[/green]" if r.success else "[red]NO[/red]"
        table.add_row(str(r.vmid), r.name, r.node, r.initial_status, sc, r.message)

    console.print(table)


# ==============================================================================
# CLI: Security Baseline Auditor
# ==============================================================================

@security_app.command("audit")
def security_audit(
    node: Optional[str] = typer.Option(None, "--node", "-n", help="Node name to audit"),
    export_remediation: Optional[str] = typer.Option(None, "--export-script", help="Export Bash fix script"),
    json_output: bool = typer.Option(False, "--json", help="Output raw JSON"),
    config: Optional[str] = typer.Option(None, "--config", "-c", help="Config file path"),
):
    """Audit Proxmox security baseline, firewall, auth, and generate hardening scripts."""
    client = get_client(config)
    auditor = SecurityAuditor(client)
    report = auditor.run_full_audit(node)

    if json_output:
        rprint(report.model_dump_json(indent=2))
        return

    score_color = "green" if report.score_percentage >= 80 else ("yellow" if report.score_percentage >= 60 else "red")
    console.print(
        Panel(
            f"[bold white]Target:[/bold white] {report.target_host}  |  "
            f"[bold white]Compliance Score:[/bold white] [{score_color} bold]{report.score_percentage}%[/{score_color} bold]\n"
            f"[green]Passed: {report.passed_checks}[/green]  |  "
            f"[yellow]Warnings: {report.warning_checks}[/yellow]  |  "
            f"[red]Failed: {report.failed_checks}[/red]",
            title="Proxmox VE Security Hardening Audit",
            border_style="magenta",
        )
    )

    table = Table(title="Security Baseline Checks", show_header=True, header_style="bold magenta")
    table.add_column("ID", style="dim", width=12)
    table.add_column("Category", style="cyan", width=16)
    table.add_column("Check Title", style="bold white", width=36)
    table.add_column("Status", justify="center", width=10)
    table.add_column("Severity", justify="center", width=10)
    table.add_column("Remediation / Details", style="dim")

    for item in report.items:
        st_color = "green" if item.status == "PASS" else ("yellow" if item.status == "WARN" else "red")
        sev_color = "red" if item.severity == "CRITICAL" else ("yellow" if item.severity == "HIGH" else "cyan")
        table.add_row(
            item.check_id,
            item.category,
            item.title,
            f"[{st_color}]{item.status}[/{st_color}]",
            f"[{sev_color}]{item.severity}[/{sev_color}]",
            item.details if item.status == "PASS" else f"[bold]{item.remediation}[/bold]",
        )

    console.print(table)

    if export_remediation:
        with open(export_remediation, "w", encoding="utf-8") as f:
            f.write(report.remediation_script)
        console.print(f"[bold green]Automated remediation script exported to: {export_remediation}[/bold green]")
    else:
        console.print("\n[dim]Run with --export-script fix_hardening.sh to generate an automated remediation bash script.[/dim]")


if __name__ == "__main__":
    app()
