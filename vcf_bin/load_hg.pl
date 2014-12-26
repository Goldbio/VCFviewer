
use IPC::Shareable;
use File::Spec;
#use Devel::Size qw(size total_size);

#### Options for readUCSCGeneAnnotation 
my $dbloc='humandb';
my $dbtype1='refGene';
my $buildver='hg19'; 
my $genomebinsize=10000;


my ($genedb, $geneidmap, $cdslen, $mrnalen) = readUCSCGeneAnnotation ($dbloc);
#print scalar (%$genedb),' ',scalar(%$geneidmap),' ',scalar(%$cdslen), ' ',scalar(%$mrnalen ),"\n";




### Shareable 
my $glue ='data';
my %options = (
	create    => 'yes',
	exclusive => 0,
	mode      => 0644,
	size=>1000000,
	destroy => 1,
);

tie %ucsc, 'IPC::Shareable', $glue, { %options } or die "ANNOVAR server :: tie failed\n";


%ucsc=(
#	genedb => $genedb,
#	geneidmap => $geneidmap,
#	cdslen =>$cdslen,
   mrnalen =>$mrnalen
);
	

print "ANNOVAR server initiated\n";
IPC::Shareable->clean_up_all;


sub readUCSCGeneAnnotation {			#read RefGene annotation database from the UCSC Genome Browser, convert 0-based coordinates to 1-based coordinates
	my ($dbloc) = @_;
	my ($name, $chr, $dbstrand, $txstart, $txend, $cdsstart, $cdsend, $exoncount, $exonstart, $exonend, $id, $name2, $cdsstartstat, $cdsendstat, $exonframes);
	my (%genedb, %geneidmap, %name2count, %cdslen, %mrnalen);
	my ($genecount, $ncgenecount) = (0, 0);
	
	my $dbfile;
	my $kgxref;
	my %iscoding;		#this gene name is a coding gene (if it has coding and noncoding transcripts, ignore all noncoding transcripts)
	
	if ($dbtype1 eq 'refGene') {
		$dbfile = File::Spec->catfile($dbloc, $buildver . "_$dbtype1.txt");
	} elsif ($dbtype1 eq 'knownGene') {
		$dbfile = File::Spec->catfile($dbloc, $buildver . "_$dbtype1.txt");
		my $kgxreffile = File::Spec->catfile($dbloc, $buildver . "_kgXref.txt");
		-f $kgxreffile or die "Error: the knownGene cross-reference file $kgxreffile does not exist. Please use 'annotate_variation.pl --downdb knownGene $dbloc' to download the database.\n";
		$kgxref = readKgXref ($kgxreffile);
	} elsif ($dbtype1 eq 'ensGene') {
		$dbfile = File::Spec->catfile($dbloc, $buildver . "_$dbtype1.txt");
	} else {
		$dbfile = File::Spec->catfile($dbloc, $buildver . "_$dbtype1.txt");		#added 2011feb18
		#die "FATAL ERROR: the dbype $dbtype1 is not supported in the readUCSCGeneAnnotation() subroutine.\n";		#commented 2011feb18
	}
	-f $dbfile or die "Error: The gene annotation database $dbfile does not exist. Please use 'annotate_variation.pl --downdb $dbtype $dbloc -build $buildver' to download the database.\n";


	open (GENEDB, $dbfile) or die "Error: cannot read from gene annotaion database $dbfile: $!\n";
	while (<GENEDB>) {
		s/[\r\n]+$//;							#deleting the newline characters
		my @record = split (/\t/, $_);

		if ($dbtype1 eq 'refGene') {
			@record == 16 or die "Error: invalid record in $dbfile (expecting 16 tab-delimited fields in refGene file): <$_>\n";
			($name, $chr, $dbstrand, $txstart, $txend, $cdsstart, $cdsend, $exoncount, $exonstart, $exonend, $id, $name2, $cdsstartstat, $cdsendstat, $exonframes) = @record[1..15];		#human hg18, mouse
		} elsif ($dbtype1 eq 'knownGene') {
			@record >= 11 or die "Error: invalid record in $dbfile (>=11 fields expected in knownGene file): <$_>\n";	#mm8=11, hg18=hg19=12
			($name, $chr, $dbstrand, $txstart, $txend, $cdsstart, $cdsend, $exoncount, $exonstart, $exonend) = @record[0..9];
			$name2 = $kgxref->{$name} || $name;
		} elsif ($dbtype1 eq 'ensGene') {
			@record == 16 or die "Error: invalid record in $dbfile (expecting 16 fields in ensGene file): <$_>\n";
			($name, $chr, $dbstrand, $txstart, $txend, $cdsstart, $cdsend, $exoncount, $exonstart, $exonend, $id, $name2, $cdsstartstat, $cdsendstat, $exonframes) = @record[1..15];
		} else {
			@record >= 11 or die "Error: invalid record in $dbfile (>=11 fields expected in $dbtype1 gene definition file): <$_>\n";
			($name, $chr, $dbstrand, $txstart, $txend, $cdsstart, $cdsend, $exoncount, $exonstart, $exonend, $id, $name2, $cdsstartstat, $cdsendstat, $exonframes) = @record[1..15];
			defined $name2 or $name2=$name;
			#die "FATAL ERROR: the --dbtype $dbtype is not supported in readUCSCGeneAnnotation() subroutine.\n";		#commented 2011feb18
		}
	
		#handle situations where the same transcript is mapped to several chromosomes or regions (for example, NM_019105 is mapped to chr6, chr6_cox_hap1, chr6_qbl_hap2; NM_002538 is mapped to chr5 positive and negative strand and also in chr5_h2_hap1)
		if ($chr =~ m/hap\d+$/) {
			next;			#this is a temporary solution on 2011feb19, to ignore alternative haplotype chromosomes
		}
	
		#$chr =~ s/^chr// or die "Error: invalid record found in $dbfile (chrom field not found): <$_>\n";						#UCSC always prefix "chr" to the chromosome identifier, so this is a good check to make sure that the file is the correct file
		$chr =~ s/^chr//;			#some genomes like zebrafish does not start with chr in their chromosome names.
		
		$dbstrand eq '+' or $dbstrand eq '-' or die "Error: invalid dbstrand information found in $dbfile (dbstrand has to be + or -): <$_>\n";		#dbstrand is important to know and cannot be optional
		my @exonstart = split (/,/, $exonstart); 			#remove trailing comma
		my @exonend = split (/,/, $exonend);				#remove trailing comma
		$exoncount == @exonstart or die "Error: invalid record found in $dbfile (exoncount discordance): <$exoncount vs ${\(scalar @exonstart)}>\n";
		@exonstart == @exonend or die "Error: invalid record found in $dbfile (exonstart and exonend count discordance): <${\(scalar @exonstart)} vs ${\(scalar @exonend)}>\n";
		$txstart++; $cdsstart++; map {$_++} @exonstart;			#convert 0-based coordinate to 1-based coordinate

		#LOGIC here:
		#first calcluate mRNA length, and if the transcript maps to multiple locations with discordant mRNA length, only consider the leftmost chromosome and leftmost coordinate (because the FASTA file is sorted in this manner)

		my $cdslength = 0;
		my $mrnalength = 0;
		for my $i (0 .. @exonstart-1) {
			$mrnalength += $exonend[$i]-$exonstart[$i]+1;
		}
		for my $i (0 .. @exonstart-1) {					#this calculation is valid regardless of strand
			#$mrnalength += $exonend[$i]-$exonstart[$i]+1;
			if ($cdsstart >= $exonstart[$i] and $cdsstart <= $exonend[$i]) {
				if ($cdsend <= $exonend[$i]) {
					$cdslength = $cdsend-$cdsstart+1;
					last;
				} else {
					$cdslength += $exonend[$i]-$cdsstart+1;
					next;
				}
			}
			if ($cdslength and $cdsend < $exonstart[$i]) {
				die "FATAL ERROR: impossible scenario for $name in $dbfile (cdsend is less than exon start)";
			} elsif ($cdslength and $cdsend <= $exonend[$i]) {
				$cdslength += $cdsend-$exonstart[$i]+1;
				last;
			} elsif ($cdslength and $cdsend > $exonend[$i]) {
				$cdslength += $exonend[$i]-$exonstart[$i]+1;
			}
		}
		
		if ($cdsstart != $cdsend+1) {		#coding gene
			if (defined $mrnalen{$name} and $mrnalen{$name} != $mrnalength) {
				$verbose ;
				next;
			}
			
			if (defined $cdslen{$name} and $cdslen{$name} != $cdslength) {
				$verbose ;
				next;
			}
			
			$iscoding{$name2}++;		#name2 is a coding gene, and if there is a noncoding transcript, ignore such transcripts in future analysis
		} else {		#noncoding gene
			1;
		}
		
		$cdslen{$name} = $cdslength;
		$mrnalen{$name} = $mrnalength;
				
		my ($bin1, $bin2) = (int(($txstart - $neargene)/$genomebinsize), int(($txend + $neargene)/$genomebinsize));
		for my $nextbin ($bin1 .. $bin2) {
			push @{$genedb{$chr, $nextbin}}, [$name, $dbstrand, $txstart, $txend, $cdsstart, $cdsend, [@exonstart], [@exonend], $name2];
		}
		$geneidmap{$name} = $name2;
		$genecount++;
		$name2count{$name2}++;
		$cdsstart == $cdsend+1 and $ncgenecount++;			#non-coding gene has the same start and end site
	} 
	close (GENEDB);
	
	my %badgene;
	for my $key (keys %genedb) {
		my @newgenedb;
		for my $geneinfo (@{$genedb{$key}}) {
			if (not $cdslen{$geneinfo->[0]} and $iscoding{$geneinfo->[8]}) {
				$badgene{$geneinfo->[0]}++;
				$verbose ;
			} else {
				push @newgenedb, $geneinfo;
			}
		}
		@{$genedb{$key}} = @newgenedb;
	}
	
	for my $key (keys %genedb) {						#pre-sort gene DB by txstart to faciliate future use
		@{$genedb{$key}} = sort {$a->[2] <=> $b->[2]} @{$genedb{$key}};
	}
	$verbose and %badgene ;
	return (\%genedb, \%geneidmap, \%cdslen, \%mrnalen);
}


